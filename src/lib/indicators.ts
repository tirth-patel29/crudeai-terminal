import type { Candle, Indicators } from "@/types";

const at = (arr: number[], i: number): number => arr[i] ?? 0;

export function ema(values: number[], period: number): number {
  if (!values.length) return 0;
  const k = 2 / (period + 1);
  let e = at(values, 0);
  for (let i = 1; i < values.length; i++) e = at(values, i) * k + e * (1 - k);
  return e;
}

export function emaSeries(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let e = at(values, 0);
  for (let i = 0; i < values.length; i++) {
    e = i === 0 ? at(values, 0) : at(values, i) * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

export function rsi(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gain = 0;
  let loss = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const d = at(values, i) - at(values, i - 1);
    if (d >= 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / period / (loss / period);
  return 100 - 100 / (1 + rs);
}

export function vwapSeries(candles: Candle[]): number[] {
  let pv = 0;
  let vol = 0;
  return candles.map((c) => {
    const tp = (c.high + c.low + c.close) / 3;
    pv += tp * c.volume;
    vol += c.volume;
    return vol ? pv / vol : c.close;
  });
}

export function atr(candles: Candle[], period = 14): number {
  const slice = candles.slice(-period - 1);
  if (slice.length < 2) return 1;
  let sum = 0;
  for (let i = 1; i < slice.length; i++) {
    const c = slice[i];
    const prev = slice[i - 1];
    if (!c || !prev) continue;
    sum += Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
  }
  return sum / (slice.length - 1);
}

export function computeIndicators(candles: Candle[]): Indicators {
  const closes = candles.map((c) => c.close);
  const vwaps = vwapSeries(candles);
  const last = candles[candles.length - 1];
  const lastClose = last?.close ?? 0;
  const fast = emaSeries(closes, 12);
  const slow = emaSeries(closes, 26);
  const macdLine = ema(closes, 12) - ema(closes, 26);
  const macdSignal = ema(
    fast.map((v, i) => v - at(slow, i)),
    9,
  );
  const recent = candles.slice(-40);
  const prevOi = candles[candles.length - 6]?.oi ?? 0;
  const lastOi = last?.oi ?? 0;
  return {
    ema9: ema(closes, 9),
    ema21: ema(closes, 21),
    ema50: ema(closes, 50),
    vwap: vwaps[vwaps.length - 1] ?? lastClose,
    rsi: rsi(closes),
    macd: macdLine,
    macdSignal,
    atr: atr(candles),
    avgVolume:
      candles.slice(-20).reduce((a, c) => a + c.volume, 0) / Math.max(1, Math.min(20, candles.length)),
    volume: last?.volume ?? 0,
    oiChangePct: prevOi ? ((lastOi - prevOi) / prevOi) * 100 : 0,
    support: recent.length ? Math.min(...recent.map((c) => c.low)) : lastClose,
    resistance: recent.length ? Math.max(...recent.map((c) => c.high)) : lastClose,
  };
}
