import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Tag } from "@/components/common/Bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMarket } from "@/hooks/useMarket";
import { riskService } from "@/services";

export const Route = createFileRoute("/_dash/settings")({
  head: () => ({ meta: [ { title: "Settings — CrudeAI" }, { name: "description", content: "Configure simulated risk limits, position sizing and platform preferences." }, { property: "og:title", content: "Settings — CrudeAI" }, { property: "og:description", content: "Configure simulated risk limits, position sizing and platform preferences." } ] }),
  component: Settings,
});

function Settings() {
  const m = useMarket();
  const r = m.risk;
  const field = (k: keyof typeof r, label: string) => (
    <div>
      <Label className="label-xs">{label}</Label>
      <Input className="num mt-1 h-8 text-xs" value={String(r[k])} onChange={(e) => riskService.update({ [k]: Number(e.target.value) || 0 } as never)} />
    </div>
  );
  return (
    <div>
      <PageHeader title="Settings" subtitle="Risk defaults and platform preferences" />
      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="Risk management">
          <div className="grid grid-cols-2 gap-3">
            {field("maxDailyLoss", "Max daily loss (₹)")}
            {field("maxPositionSize", "Max position size (lots)")}
            {field("maxSimultaneousPositions", "Max simultaneous positions")}
            {field("defaultStopPoints", "Default stop (points)")}
          </div>
        </Panel>
        <Panel title="Preferences">
          <div className="flex items-center justify-between py-1.5 text-xs">
            <span>Paper trading mode</span><Tag tone="ai">Always on</Tag>
          </div>
          <div className="flex items-center justify-between py-1.5 text-xs">
            <span>Sound alerts</span><Switch checked={r.soundAlerts} onCheckedChange={(v) => riskService.update({ soundAlerts: v })} />
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            CrudeAI is a simulation environment. Broker, market data and AI model endpoints are stubbed behind a service layer ready for FastAPI integration.
          </p>
        </Panel>
      </div>
    </div>
  );
}
