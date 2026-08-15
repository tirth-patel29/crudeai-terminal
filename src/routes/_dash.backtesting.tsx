import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KpiCard, PageHeader, Panel } from "@/components/common/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backtestService } from "@/services";
import { fmtInr } from "@/lib/format";
import type { BacktestResult } from "@/types";

export const Route = createFileRoute("/_dash/backtesting")({
  head: () => ({ meta: [ { title: "Backtesting — CrudeAI" }, { name: "description", content: "Replay the CrudeAI momentum strategy over simulated MCX crude oil history." }, { property: "og:title", content: "Backtesting — CrudeAI" }, { property: "og:description", content: "Replay the CrudeAI momentum strategy over simulated MCX crude oil history." } ] }),
  component: Backtesting,
});

function Backtesting() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [days, setDays] = useState(30);
  const run = async () => {
    setRunning(true);
    setResult(await backtestService.run({ days }));
    setRunning(false);
  };
  return (
    <div>
      <PageHeader title="Backtesting" subtitle="Replay the strategy over simulated history" />
      <div className="grid gap-2 lg:grid-cols-[300px_1fr]">
        <Panel title="Configuration">
          <Label className="label-xs">Lookback (days)</Label>
          <Input className="num mt-1 h-8 text-xs" value={String(days)} onChange={(e) => setDays(Number(e.target.value) || 0)} />
          <Button className="mt-3 w-full" size="sm" disabled={running} onClick={run}>{running ? "Running…" : "Run backtest"}</Button>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Uses the same seven-condition rule set as live simulation.</p>
        </Panel>
        <Panel title="Results">
          {!result ? (
            <p className="px-2 py-12 text-center text-xs text-muted-foreground">Run a backtest to see simulated results.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <KpiCard label="Net P&L" value={fmtInr(result.netPnl)} tone={result.netPnl >= 0 ? "bull" : "bear"} />
                <KpiCard label="Win rate" value={`${result.winRate.toFixed(1)}%`} />
                <KpiCard label="Trades" value={result.totalTrades} />
                <KpiCard label="Max drawdown" value={fmtInr(-Math.abs(result.maxDrawdown))} tone="bear" />
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="label-xs text-left"><th className="py-1">Day</th><th>Trades</th><th>P&L</th></tr></thead>
                  <tbody>
                    {result.daily.map((d) => (
                      <tr key={d.date} className="border-t border-border/60">
                        <td className="num py-1.5">{d.date}</td><td className="num">{d.trades}</td>
                        <td className={d.pnl >= 0 ? "num text-bull" : "num text-bear"}>{fmtInr(d.pnl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
