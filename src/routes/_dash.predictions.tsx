import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KpiCard, PageHeader, Panel, Tag } from "@/components/common/Bits";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMarket } from "@/hooks/useMarket";
import { fmtTime } from "@/lib/format";
import type { Prediction } from "@/types";

export const Route = createFileRoute("/_dash/predictions")({
  head: () => ({
    meta: [
      { title: "AI Predictions — CrudeAI" },
      { name: "description", content: "Every simulated next-candle prediction with confidence, actual outcome and model version." },
      { property: "og:title", content: "AI Predictions — CrudeAI" },
      { property: "og:description", content: "Every simulated next-candle prediction with confidence, actual outcome and model version." },
    ],
  }),
  component: Predictions,
});

function Predictions() {
  const m = useMarket();
  const [detail, setDetail] = useState<Prediction | null>(null);
  const s = m.predictionStats;
  return (
    <div>
      <PageHeader title="AI predictions" subtitle="Locked prediction log — historical predictions never repaint" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard label="Total predictions" value={s.total.toLocaleString("en-IN")} />
        <KpiCard label="Correct" value={s.correct.toLocaleString("en-IN")} tone="bull" />
        <KpiCard label="Wrong" value={s.wrong.toLocaleString("en-IN")} tone="bear" />
        <KpiCard label="Accuracy" value={`${s.accuracy.toFixed(2)}%`} tone="ai" />
      </div>
      <Panel title="Prediction history" className="mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="label-xs text-left"><th className="py-1">Timestamp</th><th>Direction</th><th>Confidence</th><th>Actual</th><th>Result</th><th>Move</th><th>Strategy</th><th>Model</th></tr></thead>
            <tbody>
              {[...m.predictions].reverse().map((p) => (
                <tr key={p.id} onClick={() => setDetail(p)} className="cursor-pointer border-t border-border/60 hover:bg-panel-2">
                  <td className="num py-1.5">{fmtTime(p.targetTime)}</td>
                  <td className={p.direction === "UP" ? "text-bull" : "text-bear"}>{p.direction}</td>
                  <td className="num">{p.confidence}%</td>
                  <td>{p.actualDirection ?? "—"}</td>
                  <td className={p.outcome === "CORRECT" ? "text-bull" : "text-bear"}>{p.outcome === "CORRECT" ? "✓" : "✕"}</td>
                  <td className="num">{(p.actualMovePct ?? 0).toFixed(2)}%</td>
                  <td className="text-muted-foreground">{p.strategyAtTime ?? "—"}</td>
                  <td className="text-muted-foreground">{p.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Prediction analysis</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-2 text-xs">
              <Tag tone={detail.outcome === "CORRECT" ? "bull" : "bear"}>{detail.outcome}</Tag>
              <div className="num">Predicted {detail.direction} at {detail.confidence}% · actual {detail.actualDirection}</div>
              <div className="text-muted-foreground">Predicted {fmtTime(detail.createdAt, true)} · resolved {fmtTime(detail.targetTime, true)} · {detail.model}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
