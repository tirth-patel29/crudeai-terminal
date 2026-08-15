import { createFileRoute, Link } from "@tanstack/react-router";
import { CandleChart, DEFAULT_OVERLAYS } from "@/components/chart/CandleChart";
import { KpiCard, PageHeader, Panel, SimBadge, Tag } from "@/components/common/Bits";
import { PredictionPanel } from "@/components/terminal/PredictionPanel";
import { StrategyPanel } from "@/components/terminal/Panels";
import { useMarket } from "@/hooks/useMarket";
import { fmtInr, fmtPct, fmtPrice, fmtTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_dash/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — CrudeAI terminal" },
      { name: "description", content: "Live simulated overview of MCX Crude Oil price, AI direction, strategy state and paper P&L." },
      { property: "og:title", content: "Overview — CrudeAI terminal" },
      { property: "og:description", content: "Live simulated overview of price, AI direction, strategy state and paper P&L." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const m = useMarket();
  const p = m.activePrediction;
  const paused = m.market.connection !== "CONNECTED";

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="What is happening right now in the simulated MCX Crude Oil session"
        action={
          <div className="flex items-center gap-2">
            <SimBadge />
            <Button asChild size="sm">
              <Link to="/terminal">Open live terminal</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
        <KpiCard label="Crude oil" value={`₹${fmtPrice(m.market.price, 1)}`} sub={`H ${fmtPrice(m.market.dayHigh, 1)} · L ${fmtPrice(m.market.dayLow, 1)}`} />
        <KpiCard label="Daily change" value={fmtPct(m.market.changePct)} tone={m.market.changePct >= 0 ? "bull" : "bear"} sub={`${fmtInr(m.market.change, 1)} pts`} />
        <KpiCard label="AI direction" value={p?.direction ?? "—"} tone={p?.direction === "UP" ? "bull" : p ? "bear" : "default"} sub={`Model ${p?.model ?? "offline"}`} />
        <KpiCard label="AI confidence" value={`${p?.confidence ?? 0}%`} tone="ai" sub="Probabilistic, not guaranteed" />
        <KpiCard label="Strategy" value={m.signal.verdict.replace("_", " ")} tone={m.signal.verdict === "LONG" ? "bull" : m.signal.verdict === "SHORT" ? "bear" : "warn"} sub={`${m.signal.passedCount}/${m.signal.totalCount} confirmations`} />
        <KpiCard label="Today's P&L" value={fmtInr(m.stats.todayPnl)} tone={m.stats.todayPnl >= 0 ? "bull" : "bear"} sub={`${m.positions.length} open · paper`} />
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_320px]">
        <Panel title={`MCX Crude Oil · ${m.timeframe}`} action={<Tag tone="ai">AI overlay on</Tag>} dense className="h-[380px]">
          <CandleChart candles={m.candles} indicators={m.indicators} prediction={paused ? null : m.activePrediction} settled={m.predictions} overlays={DEFAULT_OVERLAYS} />
        </Panel>
        <div className="flex flex-col gap-2">
          <PredictionPanel prediction={m.activePrediction} lastSettled={m.lastSettled} progress={m.candleProgress} paused={paused} />
        </div>
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-[320px_1fr]">
        <StrategyPanel signal={m.signal} price={m.market.price} />
        <Panel title="Recent prediction results">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="label-xs text-left">
                  <th className="py-1">Time</th><th>Direction</th><th>Confidence</th><th>Actual</th><th>Result</th><th className="text-right">Move</th>
                </tr>
              </thead>
              <tbody>
                {[...m.predictions].reverse().slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="num py-1.5">{fmtTime(r.targetTime)}</td>
                    <td className={r.direction === "UP" ? "text-bull" : "text-bear"}>{r.direction}</td>
                    <td className="num">{r.confidence}%</td>
                    <td className={r.actualDirection === "UP" ? "text-bull" : "text-bear"}>{r.actualDirection}</td>
                    <td className={r.outcome === "CORRECT" ? "text-bull" : "text-bear"}>{r.outcome === "CORRECT" ? "✓ Correct" : "✕ Wrong"}</td>
                    <td className="num text-right">{(r.actualMovePct ?? 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
