import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, Tag } from "@/components/common/Bits";
import { useMarket } from "@/hooks/useMarket";
import { fmtDate, fmtInr, fmtPrice, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dash/history")({
  head: () => ({
    meta: [
      { title: "Trade History — CrudeAI" },
      { name: "description", content: "Filterable log of simulated trades with entry, exit, P&L, strategy and exit reason." },
      { property: "og:title", content: "Trade History — CrudeAI" },
      { property: "og:description", content: "Filterable log of simulated trades with entry, exit, P&L, strategy and exit reason." },
    ],
  }),
  component: History,
});

const RANGES = [["1", "Today"], ["7", "7 days"], ["30", "30 days"]] as const;

function History() {
  const m = useMarket();
  const [range, setRange] = useState("30");
  const [side, setSide] = useState("ALL");
  const [result, setResult] = useState("ALL");
  const now = Math.max(...m.trades.map((t) => t.closedAt), 0);
  const trades = m.trades.filter((t) =>
    t.closedAt >= now - Number(range) * 86400000 &&
    (side === "ALL" || t.side === side) &&
    (result === "ALL" || (result === "WIN" ? t.pnl > 0 : t.pnl <= 0)));

  const Btn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) => (
    <button onClick={onClick} className={cn("rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.08em]", active ? "border-ai/50 bg-ai-soft text-ai" : "border-border text-muted-foreground")}>{children}</button>
  );

  return (
    <div>
      <PageHeader title="Trade history" subtitle="Simulated fills only" />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {RANGES.map(([v, l]) => <Btn key={v} active={range === v} onClick={() => setRange(v)}>{l}</Btn>)}
        <span className="mx-1 w-px bg-border" />
        {["ALL", "LONG", "SHORT"].map((s) => <Btn key={s} active={side === s} onClick={() => setSide(s)}>{s}</Btn>)}
        <span className="mx-1 w-px bg-border" />
        {["ALL", "WIN", "LOSS"].map((r) => <Btn key={r} active={result === r} onClick={() => setResult(r)}>{r}</Btn>)}
      </div>
      <Panel dense>
        {trades.length === 0 ? <EmptyState title="No trades in this range" body="Adjust the filters or run the demo to generate simulated trades." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="label-xs text-left"><th className="py-1">Time</th><th>Instrument</th><th>Side</th><th>Entry</th><th>Exit</th><th>SL</th><th>Target</th><th>P&L</th><th>Strategy</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="num py-1.5">{fmtDate(t.closedAt)} {fmtTime(t.closedAt)}</td>
                    <td>{t.symbol}</td>
                    <td className={t.side === "LONG" ? "text-bull" : "text-bear"}>{t.side}</td>
                    <td className="num">{fmtPrice(t.entry, 1)}</td><td className="num">{fmtPrice(t.exit, 1)}</td>
                    <td className="num">{fmtPrice(t.stopLoss, 1)}</td><td className="num">{fmtPrice(t.target, 1)}</td>
                    <td className={cn("num", t.pnl >= 0 ? "text-bull" : "text-bear")}>{fmtInr(t.pnl)}</td>
                    <td className="text-muted-foreground">Momentum</td><td className="text-muted-foreground">{t.reason}</td>
                    <td><Tag tone={t.status === "TARGET" ? "bull" : t.status === "STOPLOSS" ? "bear" : "muted"}>{t.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
