import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CandleChart, DEFAULT_OVERLAYS, type ChartOverlays } from "@/components/chart/CandleChart";
import { Panel, SimBadge, Tag } from "@/components/common/Bits";
import { PredictionPanel } from "@/components/terminal/PredictionPanel";
import { OrderPanel, PositionCard, ReasoningPanel, StrategyPanel, WatchlistPanel } from "@/components/terminal/Panels";
import { useMarket } from "@/hooks/useMarket";
import { marketDataService } from "@/services";
import { TIMEFRAMES } from "@/lib/engine";
import { fmtPrice, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Prediction, Timeframe } from "@/types";

export const Route = createFileRoute("/_dash/terminal")({
  head: () => ({
    meta: [
      { title: "Live Terminal — CrudeAI" },
      { name: "description", content: "Candlestick terminal with AI next-candle prediction, strategy confirmation and simulated execution." },
      { property: "og:title", content: "Live Terminal — CrudeAI" },
      { property: "og:description", content: "AI next-candle prediction over a live simulated MCX Crude Oil chart." },
    ],
  }),
  component: Terminal,
});

function Terminal() {
  const m = useMarket();
  const [overlays, setOverlays] = useState<ChartOverlays>(DEFAULT_OVERLAYS);
  const [detail, setDetail] = useState<Prediction | null>(null);
  const paused = m.market.connection !== "CONNECTED";
  const toggle = (k: keyof ChartOverlays) => setOverlays((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="grid gap-2 xl:grid-cols-[210px_1fr_320px]">
      <div className="hidden xl:block"><WatchlistPanel items={m.watchlist} /></div>

      <div className="flex min-w-0 flex-col gap-2">
        <Panel
          dense
          className="min-h-[440px]"
          title={
            <span className="flex items-center gap-2">
              MCX CRUDE OIL · {m.timeframe}
              <span className="num text-foreground">₹{fmtPrice(m.market.price, 1)}</span>
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              <SimBadge />
              <div className="flex rounded-sm border border-border bg-panel-2 p-[2px]">
                {TIMEFRAMES.map((tf: Timeframe) => (
                  <button key={tf} onClick={() => marketDataService.setTimeframe(tf)}
                    className={cn("rounded-[3px] px-1.5 py-[2px] text-[10px] num", m.timeframe === tf ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="flex flex-wrap gap-2 border-b border-border pb-2">
            {(Object.keys(DEFAULT_OVERLAYS) as (keyof ChartOverlays)[]).map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                <input type="checkbox" checked={overlays[k]} onChange={() => toggle(k)} className="h-3 w-3 accent-[var(--ai)]" />
                {k === "prediction" ? "AI prediction" : k === "zones" ? "Strategy zones" : k}
              </label>
            ))}
          </div>
          <div className="h-[380px]">
            <CandleChart candles={m.candles} indicators={m.indicators} prediction={paused ? null : m.activePrediction}
              settled={m.predictions} overlays={overlays} onMarkerClick={setDetail} />
          </div>
        </Panel>

        <Panel title="Prediction timeline" dense>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[...m.predictions].reverse().slice(0, 24).map((p) => (
              <button key={p.id} onClick={() => setDetail(p)}
                className={cn("min-w-[92px] rounded-sm border px-2 py-1.5 text-left", p.outcome === "CORRECT" ? "border-bull/35 bg-bull-soft" : "border-bear/35 bg-bear-soft")}>
                <div className="num text-[10px] text-muted-foreground">{fmtTime(p.targetTime)}</div>
                <div className="num text-[11px]">{p.direction} · {p.confidence}%</div>
                <div className={cn("text-[10px]", p.outcome === "CORRECT" ? "text-bull" : "text-bear")}>
                  {p.outcome === "CORRECT" ? "✓ correct" : "✕ wrong"}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <div className="grid gap-2 md:grid-cols-2">
          <Panel title="Open positions" dense>
            {m.positions.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">No open simulated positions.</p>
            ) : (
              <div className="flex flex-col gap-2">{m.positions.map((p) => <PositionCard key={p.id} position={p} />)}</div>
            )}
          </Panel>
          <OrderPanel price={m.market.price} defaults={m.signal.setup ? { side: m.signal.verdict === "SHORT" ? "SHORT" : "LONG", stopLoss: m.signal.setup.stopLoss, target: m.signal.setup.target1 } : null} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <PredictionPanel prediction={m.activePrediction} lastSettled={m.lastSettled} progress={m.candleProgress} paused={paused} />
        <ReasoningPanel prediction={m.activePrediction} />
        <StrategyPanel signal={m.signal} price={m.market.price} />
        <div className="xl:hidden"><WatchlistPanel items={m.watchlist} /></div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Prediction details</DialogTitle></DialogHeader>
          {detail && (
            <dl className="space-y-1.5 text-xs">
              {[["Prediction", detail.direction], ["Confidence", `${detail.confidence}%`], ["Actual", detail.actualDirection ?? "—"],
                ["Result", detail.outcome], ["Move", `${(detail.actualMovePct ?? 0).toFixed(2)}%`], ["Model", detail.model],
                ["Prediction timestamp", fmtTime(detail.createdAt, true)], ["Actual candle", fmtTime(detail.targetTime, true)]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/60 pb-1">
                  <dt className="text-muted-foreground">{k}</dt><dd className="num">{v}</dd>
                </div>
              ))}
              <Tag tone={detail.outcome === "CORRECT" ? "bull" : "bear"}>{detail.outcome}</Tag>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
