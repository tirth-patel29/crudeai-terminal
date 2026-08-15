import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, KpiCard, PageHeader, Panel } from "@/components/common/Bits";
import { PositionCard } from "@/components/terminal/Panels";
import { useMarket } from "@/hooks/useMarket";
import { fmtInr } from "@/lib/format";

export const Route = createFileRoute("/_dash/positions")({
  head: () => ({
    meta: [
      { title: "Positions — CrudeAI" },
      { name: "description", content: "Open simulated positions with live mark-to-market P&L, stop loss and target management." },
      { property: "og:title", content: "Positions — CrudeAI" },
      { property: "og:description", content: "Open simulated positions with live mark-to-market P&L, stop loss and target management." },
    ],
  }),
  component: Positions,
});

function Positions() {
  const m = useMarket();
  const open = m.positions.reduce((a, p) => a + p.pnl, 0);
  return (
    <div>
      <PageHeader title="Positions" subtitle="Paper positions marked to the simulated last traded price" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard label="Open positions" value={m.positions.length} />
        <KpiCard label="Open P&L" value={fmtInr(open)} tone={open >= 0 ? "bull" : "bear"} />
        <KpiCard label="Today's P&L" value={fmtInr(m.stats.todayPnl)} tone={m.stats.todayPnl >= 0 ? "bull" : "bear"} />
        <KpiCard label="Max positions" value={m.risk.maxSimultaneousPositions} />
      </div>
      <Panel title="Open" className="mt-2" dense>
        {m.positions.length === 0 ? (
          <EmptyState title="No open positions" body="When a setup is taken manually or by auto trading, the simulated position appears here." />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">{m.positions.map((p) => <PositionCard key={p.id} position={p} />)}</div>
        )}
      </Panel>
    </div>
  );
}
