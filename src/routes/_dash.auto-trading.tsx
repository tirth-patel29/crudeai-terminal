import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SimBadge, Tag } from "@/components/common/Bits";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarket } from "@/hooks/useMarket";
import { strategyService } from "@/services";
import { fmtPrice } from "@/lib/format";
import { PositionCard } from "@/components/terminal/Panels";

export const Route = createFileRoute("/_dash/auto-trading")({
  head: () => ({
    meta: [
      { title: "Auto Trading — CrudeAI" },
      { name: "description", content: "Simulated strategy automation: confidence floors, risk caps, cooldowns and paper order generation." },
      { property: "og:title", content: "Auto Trading — CrudeAI" },
      { property: "og:description", content: "Simulated strategy automation: confidence floors, risk caps, cooldowns and paper order generation." },
    ],
  }),
  component: AutoTrading,
});

function AutoTrading() {
  const m = useMarket();
  const a = m.auto;
  const num = (k: keyof typeof a, label: string, suffix?: string) => (
    <div key={String(k)}>
      <Label className="label-xs">{label}</Label>
      <div className="mt-1 flex items-center gap-1">
        <Input className="num h-7 text-xs" value={String(a[k])} onChange={(e) => strategyService.updateAuto({ [k]: Number(e.target.value) || 0 } as never)} />
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
  return (
    <div>
      <PageHeader title="Auto trading" subtitle="Simulation only — no broker is connected" action={<SimBadge />} />
      <div className="grid gap-2 lg:grid-cols-[1fr_360px]">
        <Panel title="Automation" action={<Tag tone={a.enabled ? "bull" : "muted"}>{a.enabled ? "Armed" : "Standby"}</Tag>}>
          <div className="flex items-center justify-between rounded-sm border border-border bg-panel-2 p-3">
            <div>
              <div className="text-sm font-semibold">Auto trading {a.enabled ? "ON" : "OFF"}</div>
              <p className="mt-1 max-w-md text-[11px] text-muted-foreground">
                {a.enabled
                  ? "Strategy will automatically create PAPER orders when all conditions are satisfied."
                  : "Strategy is monitoring the market but will not create simulated orders."}
              </p>
            </div>
            <Switch checked={a.enabled} onCheckedChange={(v) => strategyService.updateAuto({ enabled: v })} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {num("minConfidence", "Min AI confidence", "%")}
            {num("minRiskReward", "Min risk / reward", ": 1")}
            {num("maxTradesPerDay", "Max trades per day")}
            {num("maxDailyLoss", "Max daily loss", "₹")}
            {num("positionSize", "Position size", "lot")}
            {num("cooldownMinutes", "Cooldown after loss", "min")}
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[11px]">
              <Switch checked={a.trailingStop} onCheckedChange={(v) => strategyService.updateAuto({ trailingStop: v })} /> Trailing stop
            </label>
            <label className="flex items-center gap-2 text-[11px]">
              <Switch checked={a.requireConfirmation} onCheckedChange={(v) => strategyService.updateAuto({ requireConfirmation: v })} /> Require confirmation
            </label>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <div><div className="label-xs">Strategy</div>{a.strategy}</div>
            <div><div className="label-xs">Instrument</div>{a.instrument}</div>
            <div><div className="label-xs">Timeframe</div>{a.timeframe}</div>
          </div>
        </Panel>
        <div className="flex flex-col gap-2">
          <Panel title="Trigger monitor">
            {m.signal.setup ? (
              <div className="rounded-sm border border-bull/35 bg-bull-soft p-2.5 text-[11px]">
                <div className="text-xs font-semibold text-bull">Auto trade conditions met · {m.signal.verdict}</div>
                <div className="num mt-1">Entry ₹{fmtPrice(m.market.price, 1)} · SL ₹{fmtPrice(m.signal.setup.stopLoss, 1)} · Target ₹{fmtPrice(m.signal.setup.target1, 1)}</div>
                <div className="mt-1 text-muted-foreground">AI {m.activePrediction?.confidence ?? 0}% · {m.signal.passedCount}/{m.signal.totalCount} confirmations</div>
              </div>
            ) : (
              <div className="rounded-sm border border-warn/35 bg-warn-soft p-2.5 text-[11px] text-muted-foreground">
                Waiting for a valid signal. {m.signal.reason}
              </div>
            )}
          </Panel>
          <Panel title="Auto positions" dense>
            {m.positions.filter((p) => p.source === "AUTO").length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">No automated positions yet.</p>
            ) : m.positions.filter((p) => p.source === "AUTO").map((p) => <PositionCard key={p.id} position={p} />)}
          </Panel>
        </div>
      </div>
    </div>
  );
}
