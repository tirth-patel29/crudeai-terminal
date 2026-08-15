import { createFileRoute } from "@tanstack/react-router";
import { KpiCard, PageHeader, Panel } from "@/components/common/Bits";
import { ReasoningPanel, StrategyPanel } from "@/components/terminal/Panels";
import { useMarket } from "@/hooks/useMarket";
import { STRATEGY_NAME } from "@/lib/engine";

export const Route = createFileRoute("/_dash/strategies")({
  head: () => ({
    meta: [
      { title: "Strategies — CrudeAI" },
      { name: "description", content: "CrudeAI Momentum + Confirmation rules, live condition checks and generated trade setups." },
      { property: "og:title", content: "Strategies — CrudeAI" },
      { property: "og:description", content: "CrudeAI Momentum + Confirmation rules, live condition checks and generated trade setups." },
    ],
  }),
  component: Strategies,
});

function Strategies() {
  const m = useMarket();
  return (
    <div>
      <PageHeader title="Strategies" subtitle={STRATEGY_NAME} />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard label="Verdict" value={m.signal.verdict.replace("_", " ")} tone={m.signal.verdict === "LONG" ? "bull" : m.signal.verdict === "SHORT" ? "bear" : "warn"} />
        <KpiCard label="Confirmations" value={`${m.signal.passedCount}/${m.signal.totalCount}`} />
        <KpiCard label="AI confidence" value={`${m.activePrediction?.confidence ?? 0}%`} tone="ai" />
        <KpiCard label="Risk / reward" value={m.signal.setup ? `1 : ${m.signal.setup.riskReward.toFixed(1)}` : "—"} />
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        <StrategyPanel signal={m.signal} price={m.market.price} />
        <ReasoningPanel prediction={m.activePrediction} />
        <Panel title="Rule set">
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li>AI confidence ≥ 70%</li><li>EMA 9 above / below EMA 21 in signal direction</li>
            <li>Price on the correct side of VWAP</li><li>RSI confirms momentum without exhaustion</li>
            <li>Volume above the 20-bar average</li><li>Open interest confirmation</li>
            <li>Risk / reward at least 1:2</li>
          </ul>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">All seven conditions must align. Anything less prints NO TRADE — the engine never forces a setup.</p>
        </Panel>
      </div>
    </div>
  );
}
