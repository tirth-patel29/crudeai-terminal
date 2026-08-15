import { useMemo, useState } from "react";
import { useSize } from "@/hooks/useSize";
import { emaSeries, vwapSeries } from "@/lib/indicators";
import { fmtPrice, fmtTime } from "@/lib/format";
import type { Candle, Indicators, Prediction } from "@/types";

export interface ChartOverlays {
  ema9: boolean;
  ema21: boolean;
  ema50: boolean;
  vwap: boolean;
  volume: boolean;
  prediction: boolean;
  zones: boolean;
}

export const DEFAULT_OVERLAYS: ChartOverlays = {
  ema9: true,
  ema21: true,
  ema50: false,
  vwap: true,
  volume: true,
  prediction: true,
  zones: true,
};

interface Props {
  candles: Candle[];
  indicators: Indicators;
  prediction: Prediction | null;
  settled: Prediction[];
  overlays: ChartOverlays;
  visibleCount?: number;
  onMarkerClick?: (p: Prediction) => void;
  compact?: boolean;
}

export function CandleChart({
  candles,
  indicators,
  prediction,
  settled,
  overlays,
  visibleCount = 64,
  onMarkerClick,
  compact = false,
}: Props) {
  const { ref, width, height } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const view = useMemo(() => candles.slice(-visibleCount), [candles, visibleCount]);
  const emaAll = useMemo(() => {
    const closes = candles.map((c) => c.close);
    return {
      e9: emaSeries(closes, 9).slice(-visibleCount),
      e21: emaSeries(closes, 21).slice(-visibleCount),
      e50: emaSeries(closes, 50).slice(-visibleCount),
      vw: vwapSeries(candles).slice(-visibleCount),
    };
  }, [candles, visibleCount]);

  const w = width || 900;
  const h = height || 420;
  const padL = 6;
  const padR = compact ? 46 : 62;
  const padT = 10;
  const axisH = 20;
  const volH = overlays.volume ? Math.round(h * 0.16) : 0;
  const plotH = Math.max(60, h - padT - axisH - volH - 6);
  const plotW = Math.max(60, w - padL - padR);

  const slots = view.length + (overlays.prediction && prediction ? 2 : 1);
  const step = plotW / slots;
  const cw = Math.max(2, Math.min(14, step * 0.62));

  const prices = view.flatMap((c) => [c.high, c.low]);
  if (overlays.prediction && prediction) prices.push(prediction.expectedHigh, prediction.expectedLow);
  if (overlays.zones) prices.push(indicators.support, indicators.resistance);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  const padY = (max - min) * 0.08 || 5;
  min -= padY;
  max += padY;

  const y = (p: number) => padT + ((max - p) / (max - min)) * plotH;
  const x = (i: number) => padL + i * step + step / 2;

  const maxVol = Math.max(...view.map((c) => c.volume), 1);
  const volY = (v: number) => padT + plotH + 6 + (volH - (v / maxVol) * volH);

  const line = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const last = view[view.length - 1];
  const settledByTime = useMemo(() => {
    const m = new Map<number, Prediction>();
    settled.forEach((p) => m.set(p.targetTime, p));
    return m;
  }, [settled]);

  const gridLines = 5;
  const hovered = hover !== null ? view[hover] : null;

  return (
    <div ref={ref} className="relative h-full w-full select-none">
      <svg width={w} height={h} className="block">
        <defs>
          <linearGradient id="predUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bull)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--bull)" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="predDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bear)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--bear)" stopOpacity="0.5" />
          </linearGradient>
          <filter id="aiGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* horizontal grid + price axis */}
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const p = min + ((max - min) * i) / gridLines;
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={padL + plotW}
                y1={y(p)}
                y2={y(p)}
                stroke="var(--grid)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <text
                x={padL + plotW + 6}
                y={y(p) + 3}
                fill="var(--muted-foreground)"
                fontSize={compact ? 8 : 10}
                fontFamily="var(--font-mono)"
              >
                {fmtPrice(p, 0)}
              </text>
            </g>
          );
        })}

        {/* support / resistance zones */}
        {overlays.zones && (
          <>
            <line
              x1={padL}
              x2={padL + plotW}
              y1={y(indicators.resistance)}
              y2={y(indicators.resistance)}
              stroke="var(--bear)"
              strokeOpacity={0.55}
              strokeDasharray="6 4"
            />
            <text x={padL + 4} y={y(indicators.resistance) - 4} fill="var(--bear)" fontSize={9} opacity={0.85}>
              RESISTANCE {fmtPrice(indicators.resistance, 1)}
            </text>
            <line
              x1={padL}
              x2={padL + plotW}
              y1={y(indicators.support)}
              y2={y(indicators.support)}
              stroke="var(--bull)"
              strokeOpacity={0.55}
              strokeDasharray="6 4"
            />
            <text x={padL + 4} y={y(indicators.support) + 11} fill="var(--bull)" fontSize={9} opacity={0.85}>
              SUPPORT {fmtPrice(indicators.support, 1)}
            </text>
          </>
        )}

        {/* volume */}
        {overlays.volume &&
          view.map((c, i) => (
            <rect
              key={`v${c.time}`}
              x={x(i) - cw / 2}
              y={volY(c.volume)}
              width={cw}
              height={Math.max(1, padT + plotH + 6 + volH - volY(c.volume))}
              fill={c.close >= c.open ? "var(--bull)" : "var(--bear)"}
              opacity={0.28}
            />
          ))}

        {/* candles */}
        {view.map((c, i) => {
          const up = c.close >= c.open;
          const color = up ? "var(--bull)" : "var(--bear)";
          const top = y(Math.max(c.open, c.close));
          const bot = y(Math.min(c.open, c.close));
          return (
            <g
              key={c.time}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect x={x(i) - step / 2} y={padT} width={step} height={plotH} fill="transparent" />
              <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
              <rect
                x={x(i) - cw / 2}
                y={top}
                width={cw}
                height={Math.max(1, bot - top)}
                fill={up ? "var(--bull)" : "var(--bear)"}
                fillOpacity={up ? 0.9 : 0.9}
              />
            </g>
          );
        })}

        {/* indicator overlays */}
        {overlays.ema9 && <path d={line(emaAll.e9)} fill="none" stroke="var(--warn)" strokeWidth={1.2} opacity={0.9} />}
        {overlays.ema21 && <path d={line(emaAll.e21)} fill="none" stroke="var(--ai)" strokeWidth={1.2} opacity={0.9} />}
        {overlays.ema50 && (
          <path d={line(emaAll.e50)} fill="none" stroke="var(--muted-foreground)" strokeWidth={1.2} opacity={0.8} />
        )}
        {overlays.vwap && (
          <path d={line(emaAll.vw)} fill="none" stroke="var(--foreground)" strokeWidth={1} strokeDasharray="4 3" opacity={0.55} />
        )}

        {/* settled prediction markers */}
        {view.map((c, i) => {
          const p = settledByTime.get(c.time);
          if (!p || p.outcome === "PENDING") return null;
          const ok = p.outcome === "CORRECT";
          return (
            <g
              key={`m${c.time}`}
              className="cursor-pointer"
              onClick={() => onMarkerClick?.(p)}
            >
              <circle
                cx={x(i)}
                cy={y(c.high) - 12}
                r={5}
                fill={ok ? "var(--bull-soft)" : "var(--bear-soft)"}
                stroke={ok ? "var(--bull)" : "var(--bear)"}
                strokeWidth={1}
              />
              <text
                x={x(i)}
                y={y(c.high) - 9}
                textAnchor="middle"
                fontSize={7}
                fill={ok ? "var(--bull)" : "var(--bear)"}
              >
                {ok ? "✓" : "✕"}
              </text>
            </g>
          );
        })}

        {/* last price line */}
        {last && (
          <>
            <line
              x1={padL}
              x2={padL + plotW}
              y1={y(last.close)}
              y2={y(last.close)}
              stroke="var(--foreground)"
              strokeOpacity={0.35}
              strokeDasharray="3 3"
            />
            <rect x={padL + plotW + 2} y={y(last.close) - 8} width={padR - 4} height={16} rx={2} fill="var(--foreground)" />
            <text
              x={padL + plotW + 6}
              y={y(last.close) + 4}
              fontSize={compact ? 8 : 10}
              fontFamily="var(--font-mono)"
              fill="var(--background)"
            >
              {fmtPrice(last.close, 1)}
            </text>
          </>
        )}

        {/* AI predicted candle */}
        {overlays.prediction && prediction && last && (
          <g filter="url(#aiGlow)" className="rise-in">
            {(() => {
              const i = view.length;
              const up = prediction.direction === "UP";
              const openP = last.close;
              const closeP = up ? prediction.expectedHigh * 0.92 + openP * 0.08 : prediction.expectedLow * 0.92 + openP * 0.08;
              const top = y(Math.max(openP, closeP));
              const bot = y(Math.min(openP, closeP));
              const color = up ? "var(--bull)" : "var(--bear)";
              return (
                <>
                  <rect
                    x={x(i) - step / 2}
                    y={padT}
                    width={step * 1.6}
                    height={plotH}
                    fill="var(--ai)"
                    opacity={0.05}
                  />
                  <line
                    x1={x(i)}
                    x2={x(i)}
                    y1={y(prediction.expectedHigh)}
                    y2={y(prediction.expectedLow)}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.8}
                  />
                  <rect
                    x={x(i) - cw / 2}
                    y={top}
                    width={cw}
                    height={Math.max(2, bot - top)}
                    fill={up ? "url(#predUp)" : "url(#predDown)"}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="3 2"
                  />
                  <text
                    x={x(i) + cw}
                    y={up ? top - 16 : bot + 26}
                    fontSize={9}
                    fill={color}
                    fontFamily="var(--font-mono)"
                  >
                    {up ? "▲" : "▼"} {prediction.confidence}%
                  </text>
                  <text
                    x={x(i) + cw}
                    y={up ? top - 6 : bot + 15}
                    fontSize={7}
                    letterSpacing="0.14em"
                    fill="var(--ai)"
                  >
                    AI PREDICTION
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {/* time axis */}
        {view.map((c, i) =>
          i % Math.ceil(view.length / (compact ? 4 : 8)) === 0 ? (
            <text
              key={`t${c.time}`}
              x={x(i)}
              y={h - 6}
              textAnchor="middle"
              fontSize={compact ? 8 : 9}
              fill="var(--muted-foreground)"
              fontFamily="var(--font-mono)"
            >
              {fmtTime(c.time)}
            </text>
          ) : null,
        )}

        {/* crosshair */}
        {hovered && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke="var(--foreground)" strokeOpacity={0.18} />
          </g>
        )}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute left-2 top-2 flex gap-3 rounded-sm border border-border bg-popover/95 px-2 py-1 text-[10px] num">
          <span className="text-muted-foreground">{fmtTime(hovered.time)}</span>
          <span>O {fmtPrice(hovered.open, 1)}</span>
          <span>H {fmtPrice(hovered.high, 1)}</span>
          <span>L {fmtPrice(hovered.low, 1)}</span>
          <span className={hovered.close >= hovered.open ? "text-bull" : "text-bear"}>
            C {fmtPrice(hovered.close, 1)}
          </span>
          <span className="text-muted-foreground">V {hovered.volume}</span>
        </div>
      )}
    </div>
  );
}
