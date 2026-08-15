/**
 * Service layer — the ONLY boundary the UI talks to.
 *
 * Today every method resolves against the in-browser mock market engine.
 * Later these implementations can be swapped for FastAPI / WebSocket /
 * Supabase / broker calls without touching a single component.
 */
import { getEngine } from "@/lib/engine";
import type {
  Alert,
  AutoTradingConfig,
  BacktestConfig,
  BacktestResult,
  ConnectionStatus,
  Position,
  RiskSettings,
  Side,
  Timeframe,
  TradingMode,
  WatchlistItem,
} from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const marketDataService = {
  subscribe: (cb: () => void) => getEngine().subscribe(cb),
  snapshot: () => getEngine().snapshot(),
  setTimeframe: (tf: Timeframe) => getEngine().setTimeframe(tf),
  setConnection: (s: ConnectionStatus) => getEngine().setConnection(s),
  setMode: (m: TradingMode) => getEngine().setMode(m),
};

export const watchlistService = {
  add: (symbol: string) => getEngine().addWatchlistSymbol(symbol),
  replace: (items: WatchlistItem[]) => getEngine().updateWatchlist(items),
  remove: (id: string) =>
    getEngine().updateWatchlist(getEngine().watchlist.filter((w) => w.id !== id)),
  toggleStar: (id: string) =>
    getEngine().updateWatchlist(
      getEngine().watchlist.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w)),
    ),
  move: (id: string, dir: -1 | 1) => {
    const items = [...getEngine().watchlist];
    const i = items.findIndex((w) => w.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= items.length) return;
    const a = items[i];
    const b = items[j];
    if (!a || !b) return;
    items[i] = b;
    items[j] = a;
    getEngine().updateWatchlist(items);
  },
};

export const predictionService = {
  active: () => getEngine().activePrediction,
  history: () => getEngine().predictions,
};

export const strategyService = {
  current: () => getEngine().signal,
  autoConfig: () => getEngine().auto,
  updateAuto: (patch: Partial<AutoTradingConfig>) => getEngine().updateAuto(patch),
};

export const orderService = {
  place: (input: {
    side: Side;
    qty: number;
    price: number;
    stopLoss: number;
    target: number;
    type?: "MARKET" | "LIMIT";
    note?: string;
  }) => getEngine().placeOrder(input),
  cancel: (id: string) => getEngine().cancelOrder(id),
};

export const portfolioService = {
  positions: () => getEngine().positions,
  close: (id: string) => getEngine().closePosition(id),
  modify: (id: string, patch: Partial<Pick<Position, "stopLoss" | "target">>) =>
    getEngine().modifyPosition(id, patch),
  updateRisk: (patch: Partial<RiskSettings>) => getEngine().updateRisk(patch),
};

export const alertService = {
  list: () => getEngine().alerts,
  create: (a: Omit<Alert, "id" | "createdAt">) => getEngine().addAlert(a),
  remove: (id: string) => getEngine().removeAlert(id),
  toggle: (id: string) => getEngine().toggleAlert(id),
};

function seedRand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

export const backtestService = {
  async run(config: BacktestConfig, onProgress?: (pct: number, stage: string) => void): Promise<BacktestResult> {
    const stages = [
      "Loading historical candles",
      "Rebuilding indicator matrix",
      "Replaying XGB v1 predictions",
      "Applying strategy filters",
      "Simulating fills and slippage",
      "Computing performance metrics",
    ];
    for (let i = 0; i < stages.length; i++) {
      await delay(420);
      onProgress?.(Math.round(((i + 1) / stages.length) * 100), stages[i] ?? "");
    }
    const rnd = seedRand(
      config.startDate.length * 31 + Math.round(config.confidenceThreshold * 7) + Math.round(config.riskReward * 13),
    );
    const trades = 900 + Math.round(rnd() * 700);
    const winRate = 55 + rnd() * 10;
    const profitFactor = 1.3 + rnd() * 0.7;
    const netPnl = Math.round((trades * (winRate / 100) * 220 - trades * (1 - winRate / 100) * 130) * config.positionSize);
    let equity = 0;
    const equityCurve = Array.from({ length: 120 }, (_, i) => {
      equity += (rnd() - 0.42) * (netPnl / 90);
      return { index: i, equity: Math.round(equity) };
    });
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      id: Math.random().toString(36).slice(2, 9),
      config,
      trades,
      winRate,
      profitFactor,
      netPnl,
      maxDrawdown: -(4 + rnd() * 8),
      avgRR: 1.8 + rnd() * 0.6,
      equityCurve,
      monthly: months.map((m) => ({ month: m, pnl: Math.round((rnd() - 0.35) * (netPnl / 8)) })),
      completedAt: Date.now(),
    };
  },
};
