export type Direction = "UP" | "DOWN";
export type Side = "LONG" | "SHORT";
export type Timeframe = "1m" | "3m" | "5m" | "15m" | "30m" | "1H";
export type TradingMode = "PAPER" | "LIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  emailVerified: boolean;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  starred: boolean;
  primary?: boolean | undefined;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi?: number | undefined;
}

export interface Indicators {
  ema9: number;
  ema21: number;
  ema50: number;
  vwap: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  atr: number;
  avgVolume: number;
  volume: number;
  oiChangePct: number;
  support: number;
  resistance: number;
}

export interface ReasoningFactor {
  label: string;
  value: string;
  bullish: boolean | null;
  weight: number;
}

export type PredictionOutcome = "PENDING" | "CORRECT" | "WRONG";

export interface Prediction {
  id: string;
  candleTime: number;
  targetTime: number;
  createdAt: number;
  direction: Direction;
  confidence: number;
  upProbability: number;
  downProbability: number;
  expectedLow: number;
  expectedHigh: number;
  refPrice: number;
  model: string;
  timeframe: Timeframe;
  factors: ReasoningFactor[];
  outcome: PredictionOutcome;
  actualDirection?: Direction | undefined;
  actualMovePct?: number | undefined;
  actualClose?: number | undefined;
  strategyAtTime?: StrategyVerdict | undefined;
}

export type StrategyVerdict = "LONG" | "SHORT" | "NO_TRADE";

export interface StrategyCondition {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
}

export interface TradeSetup {
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: number;
}

export interface StrategySignal {
  id: string;
  strategyName: string;
  verdict: StrategyVerdict;
  conditions: StrategyCondition[];
  passedCount: number;
  totalCount: number;
  reason: string;
  setup: TradeSetup | null;
  timestamp: number;
}

export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "FILLED" | "PENDING" | "CANCELLED" | "REJECTED";
export type OrderSource = "MANUAL" | "AUTO";

export interface Order {
  id: string;
  time: number;
  symbol: string;
  side: Side;
  type: OrderType;
  qty: number;
  price: number;
  stopLoss: number;
  target: number;
  status: OrderStatus;
  source: OrderSource;
  mode: TradingMode;
  note?: string | undefined;
}

export interface Position {
  id: string;
  orderId: string;
  symbol: string;
  side: Side;
  qty: number;
  entry: number;
  ltp: number;
  stopLoss: number;
  target: number;
  pnl: number;
  openedAt: number;
  source: OrderSource;
  strategy: string;
}

export type TradeStatus = "TARGET" | "STOPLOSS" | "MANUAL";

export interface Trade {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  entry: number;
  exit: number;
  stopLoss: number;
  target: number;
  pnl: number;
  openedAt: number;
  closedAt: number;
  strategy: string;
  reason: string;
  status: TradeStatus;
  source: OrderSource;
}

export interface PortfolioStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  netPnl: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  avgRR: number;
  todayPnl: number;
}

export interface PredictionStats {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  buckets: { range: string; total: number; correct: number; accuracy: number }[];
}

export interface BacktestConfig {
  instrument: string;
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  strategy: string;
  confidenceThreshold: number;
  riskReward: number;
  positionSize: number;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  trades: number;
  winRate: number;
  profitFactor: number;
  netPnl: number;
  maxDrawdown: number;
  avgRR: number;
  equityCurve: { index: number; equity: number }[];
  monthly: { month: string; pnl: number }[];
  completedAt: number;
}

export type AlertType =
  | "AI_PREDICTION"
  | "LONG_SETUP"
  | "SHORT_SETUP"
  | "TARGET"
  | "STOP_LOSS"
  | "AUTO_TRADE"
  | "PREDICTION_RESULT";

export interface Alert {
  id: string;
  type: AlertType;
  symbol: string;
  condition: string;
  threshold?: number | undefined;
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number | undefined;
}

export interface AutoTradingConfig {
  enabled: boolean;
  strategy: string;
  instrument: string;
  timeframe: Timeframe;
  minConfidence: number;
  minRiskReward: number;
  maxTradesPerDay: number;
  maxDailyLoss: number;
  positionSize: number;
  trailingStop: boolean;
  cooldownMinutes: number;
  requireConfirmation: boolean;
}

export interface RiskSettings {
  maxDailyLoss: number;
  maxTradesPerDay: number;
  positionSize: number;
  maxSimultaneousPositions: number;
}

export type ConnectionStatus = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export interface MarketSnapshot {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  lastTickDirection: Direction | null;
  marketOpen: boolean;
  connection: ConnectionStatus;
}
