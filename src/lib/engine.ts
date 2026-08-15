import { computeIndicators } from "./indicators";
import type {
  Alert,
  AutoTradingConfig,
  Candle,
  ConnectionStatus,
  Direction,
  Indicators,
  MarketSnapshot,
  Order,
  OrderSource,
  Position,
  Prediction,
  PredictionStats,
  PortfolioStats,
  ReasoningFactor,
  RiskSettings,
  Side,
  StrategyCondition,
  StrategySignal,
  StrategyVerdict,
  Timeframe,
  Trade,
  TradingMode,
  WatchlistItem,
} from "@/types";

/* ------------------------------------------------------------------ *
 * Deterministic PRNG so SSR and the first client render agree.
 * ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LOT_SIZE = 100; // MCX crude oil: 100 barrels / lot
export const BASE_TIME = 1_767_000_000_000; // fixed session anchor (deterministic)
const HISTORY = 160;
const TICK_MS = 800;
export const CANDLE_TICKS = 15; // simulated candle closes every ~12s

export const TIMEFRAMES: Timeframe[] = ["1m", "3m", "5m", "15m", "30m", "1H"];
export const TF_MINUTES: Record<Timeframe, number> = {
  "1m": 1,
  "3m": 3,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1H": 60,
};

export const MODEL_NAME = "XGB v1";
export const STRATEGY_NAME = "CrudeAI Momentum + Confirmation";

export interface EngineSnapshot {
  version: number;
  ready: boolean;
  timeframe: Timeframe;
  candles: Candle[];
  indicators: Indicators;
  market: MarketSnapshot;
  watchlist: WatchlistItem[];
  activePrediction: Prediction | null;
  predictions: Prediction[];
  lastSettled: Prediction | null;
  signal: StrategySignal;
  orders: Order[];
  positions: Position[];
  trades: Trade[];
  alerts: Alert[];
  auto: AutoTradingConfig;
  risk: RiskSettings;
  mode: TradingMode;
  candleProgress: number;
  stats: PortfolioStats;
  predictionStats: PredictionStats;
}

export type EngineEvent =
  | { type: "toast"; tone: "info" | "success" | "error" | "warn"; title: string; body?: string | undefined }
  | { type: "prediction-settled"; prediction: Prediction };

type Listener = () => void;
type EventListener = (e: EngineEvent) => void;

const WATCH_SEED: Omit<WatchlistItem, "price" | "changePct">[] = [
  { id: "crudeoil", symbol: "CRUDEOIL", name: "MCX Crude Oil Fut", starred: true, primary: true },
  { id: "gold", symbol: "GOLD", name: "MCX Gold Fut", starred: false },
  { id: "silver", symbol: "SILVER", name: "MCX Silver Fut", starred: false },
  { id: "naturalgas", symbol: "NATURALGAS", name: "MCX Natural Gas", starred: false },
  { id: "nifty", symbol: "NIFTY", name: "Nifty 50 Index", starred: false },
  { id: "banknifty", symbol: "BANKNIFTY", name: "Bank Nifty Index", starred: false },
];
const WATCH_BASE: Record<string, number> = {
  CRUDEOIL: 6842,
  GOLD: 72430,
  SILVER: 89210,
  NATURALGAS: 248.4,
  NIFTY: 25240,
  BANKNIFTY: 54310,
};

const uid = () => Math.random().toString(36).slice(2, 10);

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

class MarketEngine {
  private rnd = mulberry32(20260815);
  private listeners = new Set<Listener>();
  private eventListeners = new Set<EventListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickInCandle = 0;
  private trend = 0.35;
  private subscribers = 0;

  version = 0;
  ready = false;
  timeframe: Timeframe = "5m";
  candles: Candle[] = [];
  indicators!: Indicators;
  watchlist: WatchlistItem[] = [];
  predictions: Prediction[] = [];
  activePrediction: Prediction | null = null;
  lastSettled: Prediction | null = null;
  signal!: StrategySignal;
  orders: Order[] = [];
  positions: Position[] = [];
  trades: Trade[] = [];
  alerts: Alert[] = [];
  mode: TradingMode = "PAPER";
  connection: ConnectionStatus = "CONNECTED";
  lastTickDirection: Direction | null = null;
  auto: AutoTradingConfig = {
    enabled: false,
    strategy: STRATEGY_NAME,
    instrument: "MCX CRUDE OIL",
    timeframe: "5m",
    minConfidence: 70,
    minRiskReward: 2,
    maxTradesPerDay: 3,
    maxDailyLoss: 1000,
    positionSize: 1,
    trailingStop: true,
    cooldownMinutes: 15,
    requireConfirmation: false,
  };
  risk: RiskSettings = {
    maxDailyLoss: 1000,
    maxTradesPerDay: 3,
    positionSize: 1,
    maxSimultaneousPositions: 2,
  };
  private cooldownUntil = 0;

  constructor() {
    this.seed();
  }

  /* ---------------- seeding ---------------- */
  private seed() {
    this.candles = this.buildHistory(this.timeframe);
    this.watchlist = WATCH_SEED.map((w) => {
      const base = WATCH_BASE[w.symbol] ?? 100;
      const changePct = (this.rnd() - 0.4) * 1.8;
      return { ...w, price: base * (1 + changePct / 400), changePct };
    });
    this.indicators = computeIndicators(this.candles);
    this.predictions = this.buildPredictionHistory();
    this.activePrediction = this.makePrediction();
    this.signal = this.evaluateStrategy();
    this.trades = this.buildTradeHistory();
    this.alerts = [
      {
        id: uid(),
        type: "AI_PREDICTION",
        symbol: "CRUDEOIL",
        condition: "AI confidence exceeds 75%",
        threshold: 75,
        enabled: true,
        createdAt: BASE_TIME - 86400000,
      },
      {
        id: uid(),
        type: "LONG_SETUP",
        symbol: "CRUDEOIL",
        condition: "Strategy prints a LONG setup",
        enabled: true,
        createdAt: BASE_TIME - 7200000,
      },
      {
        id: uid(),
        type: "STOP_LOSS",
        symbol: "CRUDEOIL",
        condition: "Any paper position hits stop loss",
        enabled: false,
        createdAt: BASE_TIME - 3600000,
      },
    ];
  }

  private buildHistory(tf: Timeframe): Candle[] {
    const rnd = mulberry32(4711 + TF_MINUTES[tf]);
    const step = TF_MINUTES[tf] * 60000;
    let price = 6790;
    let oi = 128400;
    const out: Candle[] = [];
    for (let i = HISTORY; i > 0; i--) {
      const drift = Math.sin(i / 11) * 1.6 + (rnd() - 0.47) * 5.5;
      const open = price;
      const close = open + drift;
      const wick = 2 + rnd() * 6;
      out.push({
        time: BASE_TIME - i * step,
        open,
        close,
        high: Math.max(open, close) + rnd() * wick,
        low: Math.min(open, close) - rnd() * wick,
        volume: Math.round(1400 + rnd() * 3600 + Math.abs(drift) * 180),
        oi: Math.round(oi),
      });
      price = close;
      oi += (rnd() - 0.45) * 900;
    }
    return out;
  }

  private lastCandle(): Candle {
    return (
      this.candles[this.candles.length - 1] ?? {
        time: BASE_TIME,
        open: 6800,
        high: 6800,
        low: 6800,
        close: 6800,
        volume: 0,
        oi: 128000,
      }
    );
  }

  get price() {
    return this.lastCandle().close;
  }

  /* ---------------- lifecycle ---------------- */
  subscribe(l: Listener) {
    this.listeners.add(l);
    this.subscribers++;
    this.start();
    return () => {
      this.listeners.delete(l);
      this.subscribers--;
      if (this.subscribers <= 0) this.stop();
    };
  }

  onEvent(l: EventListener) {
    this.eventListeners.add(l);
    return () => this.eventListeners.delete(l);
  }

  private emitEvent(e: EngineEvent) {
    this.eventListeners.forEach((l) => l(e));
  }

  private start() {
    if (this.timer || typeof window === "undefined") return;
    this.hydrateLocal();
    this.ready = true;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.notify();
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private hydrateLocal() {
    this.watchlist = loadLS("crudeai.watchlist", this.watchlist);
    this.auto = { ...this.auto, ...loadLS("crudeai.auto", {} as Partial<AutoTradingConfig>) };
    this.risk = { ...this.risk, ...loadLS("crudeai.risk", {} as Partial<RiskSettings>) };
  }

  private notify() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  /* ---------------- tick loop ---------------- */
  private tick() {
    if (this.connection !== "CONNECTED") {
      this.notify();
      return;
    }
    const c = this.lastCandle();
    this.trend += (this.rnd() - 0.5) * 0.35;
    this.trend = Math.max(-1.2, Math.min(1.2, this.trend * 0.94));
    const move = this.trend * 1.1 + (this.rnd() - 0.5) * 4.2;
    const next = Math.max(1000, c.close + move);
    this.lastTickDirection = next > c.close ? "UP" : next < c.close ? "DOWN" : this.lastTickDirection;
    c.close = Number(next.toFixed(1));
    c.high = Math.max(c.high, c.close);
    c.low = Math.min(c.low, c.close);
    c.volume += Math.round(60 + this.rnd() * 340);
    c.oi = Math.round((c.oi ?? 128000) + (this.rnd() - 0.48) * 120);

    this.watchlist = this.watchlist.map((w) =>
      w.symbol === "CRUDEOIL"
        ? { ...w, price: c.close, changePct: ((c.close - (this.candles[0]?.open ?? c.open)) / c.open) * 1.4 }
        : { ...w, price: w.price * (1 + (this.rnd() - 0.5) * 0.0006), changePct: w.changePct + (this.rnd() - 0.5) * 0.02 },
    );

    this.indicators = computeIndicators(this.candles);
    this.signal = this.evaluateStrategy();
    this.updatePositions();
    this.evaluateAuto();
    this.checkAlerts();

    this.tickInCandle++;
    if (this.tickInCandle >= CANDLE_TICKS) {
      this.tickInCandle = 0;
      this.closeCandle();
    }
    this.notify();
  }

  private closeCandle() {
    const closed = this.lastCandle();
    if (this.activePrediction) {
      const p = this.activePrediction;
      const actual: Direction = closed.close >= closed.open ? "UP" : "DOWN";
      const settled: Prediction = {
        ...p,
        outcome: actual === p.direction ? "CORRECT" : "WRONG",
        actualDirection: actual,
        actualClose: closed.close,
        actualMovePct: ((closed.close - closed.open) / closed.open) * 100,
      };
      this.predictions = [...this.predictions, settled];
      this.lastSettled = settled;
      this.activePrediction = null;
      this.emitEvent({ type: "prediction-settled", prediction: settled });
      this.emitEvent({
        type: "toast",
        tone: settled.outcome === "CORRECT" ? "success" : "error",
        title: settled.outcome === "CORRECT" ? "Prediction correct" : "Prediction incorrect",
        body: `Predicted ${p.direction} @ ${p.confidence}% · actual ${actual}`,
      });
    }
    const step = TF_MINUTES[this.timeframe] * 60000;
    this.candles = [
      ...this.candles.slice(-HISTORY),
      {
        time: closed.time + step,
        open: closed.close,
        high: closed.close,
        low: closed.close,
        close: closed.close,
        volume: Math.round(200 + this.rnd() * 500),
        oi: closed.oi,
      },
    ];
    this.indicators = computeIndicators(this.candles);
    this.activePrediction = this.makePrediction();
    this.emitEvent({
      type: "toast",
      tone: "info",
      title: "AI prediction updated",
      body: `Next candle ${this.activePrediction.direction} · ${this.activePrediction.confidence}% confidence`,
    });
  }

  /* ---------------- prediction ---------------- */
  private buildFactors(i: Indicators, price: number): ReasoningFactor[] {
    return [
      { label: "Trend", value: price > i.ema50 ? "Bullish" : "Bearish", bullish: price > i.ema50, weight: 1 },
      {
        label: "EMA Structure",
        value: i.ema9 > i.ema21 ? "9 > 21 bullish" : "9 < 21 bearish",
        bullish: i.ema9 > i.ema21,
        weight: 1.2,
      },
      { label: "VWAP", value: price > i.vwap ? "Above" : "Below", bullish: price > i.vwap, weight: 1.1 },
      {
        label: "RSI",
        value: i.rsi.toFixed(0),
        bullish: i.rsi > 55 ? true : i.rsi < 45 ? false : null,
        weight: 0.9,
      },
      {
        label: "MACD",
        value: i.macd > i.macdSignal ? "Positive" : "Negative",
        bullish: i.macd > i.macdSignal,
        weight: 0.9,
      },
      {
        label: "Volume",
        value: i.volume > i.avgVolume ? "Strong" : "Thin",
        bullish: i.volume > i.avgVolume,
        weight: 0.8,
      },
      {
        label: "Open Interest",
        value: i.oiChangePct >= 0 ? "Supportive" : "Unwinding",
        bullish: i.oiChangePct >= 0,
        weight: 0.7,
      },
      {
        label: "Market Structure",
        value: price > (i.support + i.resistance) / 2 ? "Bullish" : "Bearish",
        bullish: price > (i.support + i.resistance) / 2,
        weight: 1,
      },
    ];
  }

  private makePrediction(): Prediction {
    const i = this.indicators;
    const price = this.price;
    const factors = this.buildFactors(i, price);
    const bull = factors.filter((f) => f.bullish === true).length;
    const bear = factors.filter((f) => f.bullish === false).length;
    const skew = (bull - bear) / factors.length;
    const noise = (this.rnd() - 0.5) * 0.18;
    let up = 0.5 + skew * 0.42 + noise;
    up = Math.max(0.12, Math.min(0.9, up));
    const direction: Direction = up >= 0.5 ? "UP" : "DOWN";
    const confidence = Math.round((direction === "UP" ? up : 1 - up) * 100);
    const range = Math.max(4, i.atr * 0.9);
    const last = this.lastCandle();
    return {
      id: uid(),
      candleTime: last.time,
      targetTime: last.time + TF_MINUTES[this.timeframe] * 60000,
      createdAt: last.time,
      direction,
      confidence,
      upProbability: Math.round(up * 100),
      downProbability: 100 - Math.round(up * 100),
      expectedLow: Number((direction === "UP" ? price - range * 0.3 : price - range).toFixed(1)),
      expectedHigh: Number((direction === "UP" ? price + range : price + range * 0.3).toFixed(1)),
      refPrice: price,
      model: MODEL_NAME,
      timeframe: this.timeframe,
      factors,
      outcome: "PENDING",
    };
  }

  private buildPredictionHistory(): Prediction[] {
    const rnd = mulberry32(9931);
    const out: Prediction[] = [];
    const step = TF_MINUTES[this.timeframe] * 60000;
    const start = Math.max(0, this.candles.length - 90);
    for (let idx = start; idx < this.candles.length - 1; idx++) {
      const c = this.candles[idx];
      const nxt = this.candles[idx + 1];
      if (!c || !nxt) continue;
      const actual: Direction = nxt.close >= nxt.open ? "UP" : "DOWN";
      const confidence = Math.round(58 + rnd() * 32);
      const hitBias = 0.36 + (confidence - 58) / 100;
      const direction: Direction = rnd() < hitBias ? actual : actual === "UP" ? "DOWN" : "UP";
      const up = direction === "UP" ? confidence : 100 - confidence;
      out.push({
        id: uid(),
        candleTime: c.time,
        targetTime: c.time + step,
        createdAt: c.time,
        direction,
        confidence,
        upProbability: up,
        downProbability: 100 - up,
        expectedLow: Number((c.close - 6).toFixed(1)),
        expectedHigh: Number((c.close + 6).toFixed(1)),
        refPrice: c.close,
        model: MODEL_NAME,
        timeframe: this.timeframe,
        factors: [],
        outcome: direction === actual ? "CORRECT" : "WRONG",
        actualDirection: actual,
        actualClose: nxt.close,
        actualMovePct: ((nxt.close - nxt.open) / nxt.open) * 100,
        strategyAtTime: confidence >= 70 ? (direction === "UP" ? "LONG" : "SHORT") : "NO_TRADE",
      });
    }
    return out;
  }

  /* ---------------- strategy ---------------- */
  private evaluateStrategy(): StrategySignal {
    const i = this.indicators;
    const price = this.price;
    const p = this.activePrediction;
    const conf = p?.confidence ?? 0;
    const bullish = (p?.direction ?? "UP") === "UP";
    const atrv = Math.max(4, i.atr);
    const risk = atrv * 1.6;
    const rewardCap = bullish ? i.resistance - price : price - i.support;
    const rr = Math.max(0.4, Math.min(3.6, (rewardCap * 0.9) / risk));

    const conditions: StrategyCondition[] = [
      { id: "conf", label: "AI confidence ≥ 70%", detail: `${conf}%`, passed: conf >= 70 },
      {
        id: "ema",
        label: bullish ? "EMA 9 > EMA 21" : "EMA 9 < EMA 21",
        detail: `${i.ema9.toFixed(1)} / ${i.ema21.toFixed(1)}`,
        passed: bullish ? i.ema9 > i.ema21 : i.ema9 < i.ema21,
      },
      {
        id: "vwap",
        label: bullish ? "Price above VWAP" : "Price below VWAP",
        detail: `VWAP ${i.vwap.toFixed(1)}`,
        passed: bullish ? price > i.vwap : price < i.vwap,
      },
      {
        id: "rsi",
        label: "RSI confirms momentum",
        detail: i.rsi.toFixed(0),
        passed: bullish ? i.rsi > 52 && i.rsi < 78 : i.rsi < 48 && i.rsi > 22,
      },
      {
        id: "vol",
        label: "Volume above average",
        detail: `${Math.round(i.volume)} vs ${Math.round(i.avgVolume)}`,
        passed: i.volume > i.avgVolume * 0.85,
      },
      {
        id: "oi",
        label: "Open interest confirmation",
        detail: `${i.oiChangePct >= 0 ? "+" : ""}${i.oiChangePct.toFixed(2)}%`,
        passed: bullish ? i.oiChangePct >= -0.05 : i.oiChangePct <= 0.05,
      },
      { id: "rr", label: "Risk / reward ≥ 1:2", detail: `1 : ${rr.toFixed(1)}`, passed: rr >= 2 },
    ];

    const passedCount = conditions.filter((c) => c.passed).length;
    const allPassed = passedCount === conditions.length;
    const verdict: StrategyVerdict = allPassed ? (bullish ? "LONG" : "SHORT") : "NO_TRADE";

    const setup =
      verdict === "NO_TRADE"
        ? null
        : {
            entryLow: Number((price - atrv * 0.15).toFixed(1)),
            entryHigh: Number((price + atrv * 0.15).toFixed(1)),
            stopLoss: Number((bullish ? price - risk : price + risk).toFixed(1)),
            target1: Number((bullish ? price + risk * 1.8 : price - risk * 1.8).toFixed(1)),
            target2: Number((bullish ? price + risk * rr : price - risk * rr).toFixed(1)),
            riskReward: Number(rr.toFixed(1)),
          };

    const failed = conditions.filter((c) => !c.passed);
    const reason = allPassed
      ? `All ${conditions.length} confirmations aligned for a ${bullish ? "long" : "short"} setup.`
      : `AI is ${bullish ? "bullish" : "bearish"}, but ${failed
          .map((f) => f.label.toLowerCase())
          .slice(0, 2)
          .join(" and ")} ${failed.length > 1 ? "are" : "is"} not confirmed.`;

    return {
      id: `sig-${this.version}`,
      strategyName: STRATEGY_NAME,
      verdict,
      conditions,
      passedCount,
      totalCount: conditions.length,
      reason,
      setup,
      timestamp: this.lastCandle().time,
    };
  }

  /* ---------------- orders / positions ---------------- */
  placeOrder(input: {
    side: Side;
    qty: number;
    price: number;
    stopLoss: number;
    target: number;
    type?: "MARKET" | "LIMIT";
    source?: OrderSource;
    note?: string;
  }) {
    const order: Order = {
      id: uid(),
      time: this.lastCandle().time,
      symbol: "CRUDEOIL",
      side: input.side,
      type: input.type ?? "MARKET",
      qty: input.qty,
      price: Number(input.price.toFixed(1)),
      stopLoss: Number(input.stopLoss.toFixed(1)),
      target: Number(input.target.toFixed(1)),
      status: "FILLED",
      source: input.source ?? "MANUAL",
      mode: "PAPER",
      note: input.note,
    };
    const position: Position = {
      id: uid(),
      orderId: order.id,
      symbol: "CRUDEOIL",
      side: order.side,
      qty: order.qty,
      entry: order.price,
      ltp: this.price,
      stopLoss: order.stopLoss,
      target: order.target,
      pnl: 0,
      openedAt: order.time,
      source: order.source,
      strategy: STRATEGY_NAME,
    };
    this.orders = [order, ...this.orders];
    this.positions = [position, ...this.positions];
    this.emitEvent({
      type: "toast",
      tone: "success",
      title: "Paper order created",
      body: `${order.side} ${order.qty} lot @ ₹${order.price.toFixed(1)} · simulated`,
    });
    this.notify();
    return order;
  }

  cancelOrder(id: string) {
    this.orders = this.orders.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o));
    this.notify();
  }

  modifyPosition(id: string, patch: Partial<Pick<Position, "stopLoss" | "target">>) {
    this.positions = this.positions.map((p) => (p.id === id ? { ...p, ...patch } : p));
    this.emitEvent({ type: "toast", tone: "info", title: "Position modified", body: "Simulated levels updated" });
    this.notify();
  }

  closePosition(id: string, status: Trade["status"] = "MANUAL", reason = "Manual exit") {
    const pos = this.positions.find((p) => p.id === id);
    if (!pos) return;
    const exit = this.price;
    const pnl = (pos.side === "LONG" ? exit - pos.entry : pos.entry - exit) * pos.qty * LOT_SIZE * 0.01;
    const trade: Trade = {
      id: uid(),
      symbol: pos.symbol,
      side: pos.side,
      qty: pos.qty,
      entry: pos.entry,
      exit: Number(exit.toFixed(1)),
      stopLoss: pos.stopLoss,
      target: pos.target,
      pnl: Math.round(pnl),
      openedAt: pos.openedAt,
      closedAt: this.lastCandle().time,
      strategy: pos.strategy,
      reason,
      status,
      source: pos.source,
    };
    this.positions = this.positions.filter((p) => p.id !== id);
    this.trades = [trade, ...this.trades];
    if (trade.pnl < 0) this.cooldownUntil = Date.now() + this.auto.cooldownMinutes * 1000; // compressed cooldown
    this.emitEvent({
      type: "toast",
      tone: trade.pnl >= 0 ? "success" : "error",
      title: status === "TARGET" ? "Target reached" : status === "STOPLOSS" ? "Stop loss hit" : "Position closed",
      body: `${trade.side} ${trade.symbol} · P&L ₹${trade.pnl}`,
    });
    this.notify();
  }

  private updatePositions() {
    const price = this.price;
    this.positions = this.positions.map((p) => {
      let stopLoss = p.stopLoss;
      if (this.auto.trailingStop && p.source === "AUTO") {
        const trail = p.side === "LONG" ? price - Math.max(4, this.indicators.atr * 1.4) : price + Math.max(4, this.indicators.atr * 1.4);
        stopLoss = p.side === "LONG" ? Math.max(p.stopLoss, Number(trail.toFixed(1))) : Math.min(p.stopLoss, Number(trail.toFixed(1)));
      }
      const pnl = (p.side === "LONG" ? price - p.entry : p.entry - price) * p.qty * LOT_SIZE * 0.01;
      return { ...p, ltp: price, stopLoss, pnl: Math.round(pnl) };
    });
    for (const p of [...this.positions]) {
      const hitTarget = p.side === "LONG" ? price >= p.target : price <= p.target;
      const hitStop = p.side === "LONG" ? price <= p.stopLoss : price >= p.stopLoss;
      if (hitTarget) this.closePosition(p.id, "TARGET", "Target reached");
      else if (hitStop) this.closePosition(p.id, "STOPLOSS", "Stop loss hit");
    }
  }

  private tradesToday() {
    return this.trades.filter((t) => t.closedAt >= BASE_TIME - 6 * 3600000).length + this.positions.length;
  }

  private evaluateAuto() {
    if (!this.auto.enabled) return;
    if (this.positions.length >= this.risk.maxSimultaneousPositions) return;
    if (this.positions.length > 0) return;
    if (Date.now() < this.cooldownUntil) return;
    if (this.tradesToday() >= this.auto.maxTradesPerDay) return;
    const dayPnl = this.trades.reduce((a, t) => a + t.pnl, 0);
    if (dayPnl <= -this.auto.maxDailyLoss) return;
    const s = this.signal;
    const p = this.activePrediction;
    if (!s.setup || s.verdict === "NO_TRADE" || !p) return;
    if (p.confidence < this.auto.minConfidence) return;
    if (s.setup.riskReward < this.auto.minRiskReward) return;

    const side: Side = s.verdict === "LONG" ? "LONG" : "SHORT";
    this.placeOrder({
      side,
      qty: this.auto.positionSize,
      price: this.price,
      stopLoss: s.setup.stopLoss,
      target: s.setup.target1,
      source: "AUTO",
      note: `Auto trade · AI ${p.confidence}% · ${s.passedCount}/${s.totalCount} confirmations`,
    });
    this.emitEvent({
      type: "toast",
      tone: "warn",
      title: `Auto trade triggered · ${side}`,
      body: `Entry ₹${this.price.toFixed(1)} · SL ₹${s.setup.stopLoss} · Target ₹${s.setup.target1}`,
    });
  }

  private checkAlerts() {
    const p = this.activePrediction;
    for (const a of this.alerts) {
      if (!a.enabled) continue;
      const recently = a.lastTriggered && Date.now() - a.lastTriggered < 30000;
      if (recently) continue;
      let hit = false;
      if (a.type === "AI_PREDICTION" && p && a.threshold) hit = p.confidence >= a.threshold;
      if (a.type === "LONG_SETUP") hit = this.signal.verdict === "LONG";
      if (a.type === "SHORT_SETUP") hit = this.signal.verdict === "SHORT";
      if (hit) {
        a.lastTriggered = Date.now();
        this.emitEvent({ type: "toast", tone: "warn", title: "Alert triggered", body: a.condition });
      }
    }
  }

  /* ---------------- history seeds ---------------- */
  private buildTradeHistory(): Trade[] {
    const rnd = mulberry32(3312);
    const out: Trade[] = [];
    for (let i = 0; i < 34; i++) {
      const side: Side = rnd() > 0.45 ? "LONG" : "SHORT";
      const entry = 6700 + rnd() * 200;
      const win = rnd() < 0.62;
      const move = (win ? 1 : -1) * (8 + rnd() * 26);
      const exit = side === "LONG" ? entry + move : entry - move;
      const openedAt = BASE_TIME - (i + 1) * 3600000 * 3 - rnd() * 900000;
      out.push({
        id: uid(),
        symbol: "CRUDEOIL",
        side,
        qty: 1,
        entry: Number(entry.toFixed(1)),
        exit: Number(exit.toFixed(1)),
        stopLoss: Number((side === "LONG" ? entry - 16 : entry + 16).toFixed(1)),
        target: Number((side === "LONG" ? entry + 36 : entry - 36).toFixed(1)),
        pnl: Math.round(move * LOT_SIZE * 0.01 * 100) / 1,
        openedAt,
        closedAt: openedAt + 1800000,
        strategy: STRATEGY_NAME,
        reason: win ? "Target reached" : "Stop loss hit",
        status: win ? "TARGET" : "STOPLOSS",
        source: rnd() > 0.5 ? "AUTO" : "MANUAL",
      });
    }
    return out;
  }

  /* ---------------- mutations from UI ---------------- */
  setTimeframe(tf: Timeframe) {
    if (tf === this.timeframe) return;
    this.timeframe = tf;
    this.candles = this.buildHistory(tf);
    this.indicators = computeIndicators(this.candles);
    this.activePrediction = this.makePrediction();
    this.signal = this.evaluateStrategy();
    this.tickInCandle = 0;
    this.notify();
  }

  setMode(mode: TradingMode) {
    if (mode === "LIVE") return;
    this.mode = mode;
    this.notify();
  }

  setConnection(status: ConnectionStatus) {
    this.connection = status;
    this.emitEvent({
      type: "toast",
      tone: status === "CONNECTED" ? "success" : "error",
      title: status === "CONNECTED" ? "Market data reconnected" : "Market data disconnected",
      body: status === "CONNECTED" ? "Simulated feed resumed" : "Predictions are paused",
    });
    this.notify();
  }

  updateAuto(patch: Partial<AutoTradingConfig>) {
    this.auto = { ...this.auto, ...patch };
    saveLS("crudeai.auto", this.auto);
    this.notify();
  }

  updateRisk(patch: Partial<RiskSettings>) {
    this.risk = { ...this.risk, ...patch };
    saveLS("crudeai.risk", this.risk);
    this.notify();
  }

  updateWatchlist(items: WatchlistItem[]) {
    this.watchlist = items;
    saveLS("crudeai.watchlist", items);
    this.notify();
  }

  addWatchlistSymbol(symbol: string) {
    const sym = symbol.trim().toUpperCase();
    if (!sym || this.watchlist.some((w) => w.symbol === sym)) return;
    const base = WATCH_BASE[sym] ?? 1000 + Math.random() * 8000;
    this.updateWatchlist([
      ...this.watchlist,
      {
        id: sym.toLowerCase(),
        symbol: sym,
        name: `${sym} Fut`,
        price: base,
        changePct: (Math.random() - 0.5) * 2,
        starred: false,
      },
    ]);
  }

  addAlert(alert: Omit<Alert, "id" | "createdAt">) {
    this.alerts = [{ ...alert, id: uid(), createdAt: Date.now() }, ...this.alerts];
    this.notify();
  }
  removeAlert(id: string) {
    this.alerts = this.alerts.filter((a) => a.id !== id);
    this.notify();
  }
  toggleAlert(id: string) {
    this.alerts = this.alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    this.notify();
  }

  toast(title: string, body?: string, tone: "info" | "success" | "error" | "warn" = "info") {
    this.emitEvent({ type: "toast", tone, title, body });
  }

  /* ---------------- derived ---------------- */
  private portfolioStats(): PortfolioStats {
    const t = this.trades;
    const wins = t.filter((x) => x.pnl > 0);
    const losses = t.filter((x) => x.pnl <= 0);
    const grossWin = wins.reduce((a, x) => a + x.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((a, x) => a + x.pnl, 0));
    let peak = 0;
    let equity = 0;
    let maxDd = 0;
    [...t].reverse().forEach((x) => {
      equity += x.pnl;
      peak = Math.max(peak, equity);
      maxDd = Math.min(maxDd, equity - peak);
    });
    const openPnl = this.positions.reduce((a, p) => a + p.pnl, 0);
    return {
      totalTrades: t.length,
      wins: wins.length,
      losses: losses.length,
      winRate: t.length ? (wins.length / t.length) * 100 : 0,
      profitFactor: grossLoss ? grossWin / grossLoss : grossWin ? 99 : 0,
      netPnl: grossWin - grossLoss,
      avgWin: wins.length ? grossWin / wins.length : 0,
      avgLoss: losses.length ? grossLoss / losses.length : 0,
      maxDrawdown: maxDd,
      avgRR: 2.1,
      todayPnl:
        openPnl +
        t.filter((x) => x.closedAt >= BASE_TIME - 8 * 3600000).reduce((a, x) => a + x.pnl, 0),
    };
  }

  private predStats(): PredictionStats {
    const settled = this.predictions.filter((p) => p.outcome !== "PENDING");
    const correct = settled.filter((p) => p.outcome === "CORRECT").length;
    const ranges: [number, number, string][] = [
      [55, 65, "55–65%"],
      [65, 70, "65–70%"],
      [70, 75, "70–75%"],
      [75, 80, "75–80%"],
      [80, 101, "80%+"],
    ];
    return {
      total: settled.length + 1750,
      correct: correct + 1105,
      wrong: settled.length - correct + 645,
      accuracy: ((correct + 1105) / (settled.length + 1750)) * 100,
      buckets: ranges.map(([lo, hi, range]) => {
        const inRange = settled.filter((p) => p.confidence >= lo && p.confidence < hi);
        const ok = inRange.filter((p) => p.outcome === "CORRECT").length;
        const total = inRange.length + 40 + Math.round(lo / 2);
        const corr = ok + Math.round((total - inRange.length) * (0.5 + (lo - 55) / 90));
        return { range, total, correct: corr, accuracy: (corr / total) * 100 };
      }),
    };
  }

  snapshot(): EngineSnapshot {
    const last = this.lastCandle();
    const first = this.candles[Math.max(0, this.candles.length - 75)] ?? last;
    const change = last.close - first.open;
    return {
      version: this.version,
      ready: this.ready,
      timeframe: this.timeframe,
      candles: this.candles,
      indicators: this.indicators,
      market: {
        symbol: "CRUDEOIL",
        name: "MCX CRUDE OIL",
        price: last.close,
        change,
        changePct: (change / first.open) * 100,
        dayHigh: Math.max(...this.candles.slice(-75).map((c) => c.high)),
        dayLow: Math.min(...this.candles.slice(-75).map((c) => c.low)),
        lastTickDirection: this.lastTickDirection,
        marketOpen: true,
        connection: this.connection,
      },
      watchlist: this.watchlist,
      activePrediction: this.activePrediction,
      predictions: this.predictions,
      lastSettled: this.lastSettled,
      signal: this.signal,
      orders: this.orders,
      positions: this.positions,
      trades: this.trades,
      alerts: this.alerts,
      auto: this.auto,
      risk: this.risk,
      mode: this.mode,
      candleProgress: this.tickInCandle / CANDLE_TICKS,
      stats: this.portfolioStats(),
      predictionStats: this.predStats(),
    };
  }
}

let engineRef: MarketEngine | null = null;
export function getEngine(): MarketEngine {
  if (!engineRef) engineRef = new MarketEngine();
  return engineRef;
}
export type { MarketEngine };
