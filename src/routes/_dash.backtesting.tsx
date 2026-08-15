import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KpiCard, PageHeader, Panel } from "@/components/common/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backtestService } from "@/services";
import { STRATEGY_NAME } from "@/lib/engine";
import { fmtInr } from "@/lib/format";
import type { BacktestConfig, BacktestResult } from "@/types";

export const Route = createFileRoute("/_dash/backtesting")({
  head: () => ({ meta: [ { title: "Backtesting — CrudeAI" }, { name: "description", content: "Replay the CrudeAI momentum strategy over simulated MCX crude oil history." }, { property: "og:title", content: "Backtesting — CrudeAI" }, { property: "og:description", content: "Replay the CrudeAI momentum strategy over simulated MCX crude oil history." } ] }),
  component: Backtesting,
});

function Backtesting() {
  const [config, setConfig] = useState<BacktestConfig>({
    instrument: "CRUDEOIL",
    timeframe: "5m",
    startDate: "2025-01-01",
    endDate: "2026-01-01",
    strategy: STRATEGY_NAME,
    confidenceThreshold: 70,
    riskReward: 2,
    positionSize: 1,
  });
  const [progress, setProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const run = async () => {
    setResult(null);
    setProgress({ pct: 0, stage: "Starting" });
    const r = await backtestService.run(config, (pct, stage) => setProgress({ pct, stage }));
    setProgress(null);
    setResult(r);
  };

  const num = (key: "confidenceThreshold" | "riskReward" | "positionSize", label: string) => (
    <div key={key}>
      <Label className="label-xs">{label}</Label>
      <Input
        className="num mt-1 h-8 text-xs"
        value={String(config[key])}
        onChange={(e) => setConfig((c) => ({ ...c, [key]: Number(e.target.value) || 0 }))}
      />
    </div>
  );

  const equity = result?.equityCurve ?? [];
  const maxE = Math.max(...equity.map((p) => p.equity), 1);
  const minE = Math.min(...equity.map((p) => p.equity), 0);
  const path = equity
    .map((p, i) => `${(i / Math.max(equity.length - 1, 1)) * 100},${100 - ((p.equity - minE) / (maxE - minE || 1)) * 100}`)
    .join(" ");

  return (
    <div>
      <PageHeader title="Backtesting" subtitle="Replay the strategy over simulated history" />
      <div className="grid gap-2 lg:grid-cols-[300px_1fr]">
        <Panel title="Configuration">
          <div className="grid gap-3">
            <div>
              <Label className="label-xs">Start date</Label>
              <Input className="num mt-1 h-8 text-xs" value={config.startDate} onChange={(e) => setConfig((c) => ({ ...c, startDate: e.target.value }))} />
            </div>
            <div>
              <Label className="label-xs">End date</Label>
              <Input className="num mt-1 h-8 text-xs" value={config.endDate} onChange={(e) => setConfig((c) => ({ ...c, endDate: e.target.value }))} />
            </div>
            {num("confidenceThreshold", "Confidence threshold (%)")}
            {num("riskReward", "Min risk / reward")}
            {num("positionSize", "Position size (lots)")}
          </div>
          <Button className="mt-3 w-full" size="sm" disabled={!!progress} onClick={run}>
            {progress ? "Running…" : "Run backtest"}
          </Button>
          {progress && (
            <div className="mt-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-panel-2">
                <div className="h-full bg-[var(--ai)] transition-all" style={{ width: `${progress.pct}%` }} />
              </div>
              <div className="num mt-1 text-[10px] text-muted-foreground">{progress.stage}…</div>
            </div>
          )}
        </Panel>
        <Panel title="Results">
          {!result ? (
            <p className="px-2 py-12 text-center text-xs text-muted-foreground">Run a backtest to see simulated results.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <KpiCard label="Net P&L" value={fmtInr(result.netPnl)} tone={result.netPnl >= 0 ? "bull" : "bear"} />
                <KpiCard label="Win rate" value={`${result.winRate.toFixed(1)}%`} />
                <KpiCard label="Trades" value={result.trades.toLocaleString("en-IN")} />
                <KpiCard label="Max drawdown" value={`${result.maxDrawdown.toFixed(1)}%`} tone="bear" />
                <KpiCard label="Profit factor" value={result.profitFactor.toFixed(2)} />
                <KpiCard label="Avg R:R" value={`1 : ${result.avgRR.toFixed(2)}`} />
                <KpiCard label="Strategy" value={result.config.strategy} />
                <KpiCard label="Timeframe" value={result.config.timeframe} />
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-3 h-40 w-full">
                <polyline points={path} fill="none" stroke="var(--ai)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="mt-3 grid grid-cols-6 gap-1">
                {result.monthly.map((mo) => (
                  <div key={mo.month} className="rounded-sm border border-border bg-panel-2 p-1.5 text-center">
                    <div className="label-xs">{mo.month}</div>
                    <div className={mo.pnl >= 0 ? "num text-[10px] text-bull" : "num text-[10px] text-bear"}>{fmtInr(mo.pnl)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
