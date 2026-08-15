import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Tag } from "@/components/common/Bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarket } from "@/hooks/useMarket";
import { portfolioService } from "@/services";
import type { RiskSettings } from "@/types";

export const Route = createFileRoute("/_dash/settings")({
  head: () => ({ meta: [ { title: "Settings — CrudeAI" }, { name: "description", content: "Configure simulated risk limits, daily loss caps and position sizing defaults." }, { property: "og:title", content: "Settings — CrudeAI" }, { property: "og:description", content: "Configure simulated risk limits, daily loss caps and position sizing defaults." } ] }),
  component: Settings,
});

const FIELDS: { key: keyof RiskSettings; label: string }[] = [
  { key: "maxDailyLoss", label: "Max daily loss (₹)" },
  { key: "maxTradesPerDay", label: "Max trades per day" },
  { key: "positionSize", label: "Default position size (lots)" },
  { key: "maxSimultaneousPositions", label: "Max simultaneous positions" },
];

function Settings() {
  const m = useMarket();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Risk defaults and platform preferences" />
      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="Risk management">
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="label-xs">{f.label}</Label>
                <Input
                  className="num mt-1 h-8 text-xs"
                  value={String(m.risk[f.key])}
                  onChange={(e) => portfolioService.updateRisk({ [f.key]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Platform">
          <div className="flex items-center justify-between py-1.5 text-xs">
            <span>Trading mode</span><Tag tone="ai">Paper only</Tag>
          </div>
          <div className="flex items-center justify-between py-1.5 text-xs">
            <span>Data feed</span><Tag tone="muted">Simulated MCX</Tag>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            CrudeAI is a simulation environment. Market data, AI model and broker calls are stubbed behind a service layer ready for FastAPI and broker integration.
          </p>
        </Panel>
      </div>
    </div>
  );
}
