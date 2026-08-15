import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, Tag } from "@/components/common/Bits";
import { useMarket } from "@/hooks/useMarket";
import { fmtTime } from "@/lib/format";

export const Route = createFileRoute("/_dash/alerts")({
  head: () => ({ meta: [ { title: "Alerts — CrudeAI" }, { name: "description", content: "Signal, execution and risk alerts from the simulated trading session." }, { property: "og:title", content: "Alerts — CrudeAI" }, { property: "og:description", content: "Signal, execution and risk alerts from the simulated trading session." } ] }),
  component: Alerts,
});

function Alerts() {
  const m = useMarket();
  return (
    <div>
      <PageHeader title="Alerts" subtitle="Signal, execution and risk notifications" />
      <Panel dense>
        {m.alerts.length === 0 ? <EmptyState title="No alerts" body="Alerts appear as the simulated session generates signals and fills." /> : (
          <ul className="divide-y divide-border/60">
            {m.alerts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className="text-xs">{a.message}</div>
                  <div className="num mt-0.5 text-[10px] text-muted-foreground">{fmtTime(a.time, true)}</div>
                </div>
                <Tag tone={a.kind === "SIGNAL" ? "ai" : a.kind === "RISK" ? "bear" : "muted"}>{a.kind}</Tag>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
