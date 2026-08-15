import { createFileRoute } from "@tanstack/react-router";
import { KpiCard, PageHeader, Panel } from "@/components/common/Bits";
import { useMarket } from "@/hooks/useMarket";
import { fmtInr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dash/performance")({
  head: () => ({ meta: [ { title: "Performance — CrudeAI" }, { name: "description", content: "Simulated equity curve, win rate, profit factor, drawdown and AI accuracy analytics." }, { property: "og:title", content: "Performance — CrudeAI" }, { property: "og:description", content: "Simulated equity curve, win rate, profit factor, drawdown and AI accuracy analytics." } ] }),
  component: Performance,
});

function Performance() {
  const m = useMarket();
  const s = m.stats;
  let cum = 0;
  const curve = [...m.trades].sort((a, b) => a.closedAt - b.closedAt).map((t) => (cum += t.pnl));
  const max = Math.max(...curve, 1);
  const min = Math.min(...curve, 0);
  const path = curve.map((v, i) => `${(i / Math.max(curve.length - 1, 1)) * 100},${100 - ((v - min) / (max - min || 1)) * 100}`).join(" ");
  return (
    <div>
      <PageHeader title="Performance" subtitle="Simulated results — not investment advice" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard label="Net P&L" value={fmtInr(s.netPnl)} tone={s.netPnl >= 0 ? "bull" : "bear"} />
        <KpiCard label="Win rate" value={`${s.winRate.toFixed(1)}%`} />
        <KpiCard label="Profit factor" value={s.profitFactor.toFixed(2)} />
        <KpiCard label="Max drawdown" value={fmtInr(-Math.abs(s.maxDrawdown))} tone="bear" />
        <KpiCard label="Total trades" value={s.totalTrades} />
        <KpiCard label="Avg win" value={fmtInr(s.avgWin)} tone="bull" />
        <KpiCard label="Avg loss" value={fmtInr(-Math.abs(s.avgLoss))} tone="bear" />
        <KpiCard label="AI accuracy" value={`${m.predictionStats.accuracy.toFixed(1)}%`} tone="ai" />
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <Panel title="Equity curve">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-52 w-full">
            <polyline points={path} fill="none" stroke="var(--ai)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          </svg>
        </Panel>
        <Panel title="Daily P&L">
          <div className="flex h-52 items-end gap-1">
            {m.dailyPnl.map((d) => {
              const peak = Math.max(...m.dailyPnl.map((x) => Math.abs(x.pnl)), 1);
              return (
                <div key={d.date} title={`${d.date}: ${fmtInr(d.pnl)}`} className="flex-1">
                  <div className={cn("mx-auto w-full rounded-[2px]", d.pnl >= 0 ? "bg-bull/70" : "bg-bear/70")} style={{ height: `${(Math.abs(d.pnl) / peak) * 180}px` }} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
