import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, Tag } from "@/components/common/Bits";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useMarket } from "@/hooks/useMarket";
import { alertService } from "@/services";
import { fmtTime } from "@/lib/format";

export const Route = createFileRoute("/_dash/alerts")({
  head: () => ({ meta: [ { title: "Alerts — CrudeAI" }, { name: "description", content: "Price, signal and risk alerts for the simulated MCX crude oil session." }, { property: "og:title", content: "Alerts — CrudeAI" }, { property: "og:description", content: "Price, signal and risk alerts for the simulated MCX crude oil session." } ] }),
  component: Alerts,
});

function Alerts() {
  const m = useMarket();
  return (
    <div>
      <PageHeader title="Alerts" subtitle="Signal, price and risk notifications" />
      <Panel dense>
        {m.alerts.length === 0 ? (
          <EmptyState title="No alerts" body="Alerts appear as the simulated session generates signals." />
        ) : (
          <ul className="divide-y divide-border/60">
            {m.alerts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className="text-xs">{a.symbol} · {a.condition}{a.threshold !== undefined ? ` ${a.threshold}` : ""}</div>
                  <div className="num mt-0.5 text-[10px] text-muted-foreground">
                    Created {fmtTime(a.createdAt, true)}
                    {a.lastTriggered ? ` · last triggered ${fmtTime(a.lastTriggered)}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag tone={a.type === "PRICE" ? "muted" : "ai"}>{a.type}</Tag>
                  <Switch checked={a.enabled} onCheckedChange={() => alertService.toggle(a.id)} />
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => alertService.remove(a.id)}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
