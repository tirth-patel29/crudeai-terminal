import { ArrowDownRight, ArrowUpRight, Brain, CircleSlash } from "lucide-react";
import { ConfidenceMeter, Panel, Tag } from "@/components/common/Bits";
import { fmtPrice, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prediction } from "@/types";

export function PredictionPanel({
  prediction,
  lastSettled,
  progress,
  paused,
}: {
  prediction: Prediction | null;
  lastSettled: Prediction | null;
  progress: number;
  paused?: boolean;
}) {
  if (paused || !prediction) {
    return (
      <Panel title="AI next candle">
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CircleSlash className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm font-medium">Prediction unavailable</div>
          <p className="max-w-[220px] text-xs text-muted-foreground">
            The simulated feed is paused. The model needs a live candle stream to score the next bar.
          </p>
        </div>
      </Panel>
    );
  }

  const up = prediction.direction === "UP";
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <Brain className="h-3 w-3 text-ai" /> AI next candle
        </span>
      }
      action={<Tag tone="ai">{prediction.model}</Tag>}
    >
      <div className="rise-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-sm border",
                up ? "border-bull/40 bg-bull-soft" : "border-bear/40 bg-bear-soft",
              )}
            >
              <Icon className={cn("h-5 w-5", up ? "text-bull" : "text-bear")} />
            </div>
            <div>
              <div className={cn("num text-2xl font-semibold leading-none", up ? "text-bull" : "text-bear")}>
                {prediction.direction}
              </div>
              <div className="label-xs mt-1">next 5m candle</div>
            </div>
          </div>
          <div className="text-right">
            <div className="label-xs">Settles in</div>
            <div className="num text-sm">{Math.max(0, Math.round((1 - progress) * 100))}%</div>
          </div>
        </div>

        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full bg-ai transition-all duration-500 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <div className="mt-3">
          <ConfidenceMeter value={prediction.confidence} direction={prediction.direction} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <ProbBar label="UP probability" value={prediction.upProbability} tone="bull" />
          <ProbBar label="DOWN probability" value={prediction.downProbability} tone="bear" />
        </div>

        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[11px]">
          <Row label="Expected range" value={`₹${fmtPrice(prediction.expectedLow, 1)} – ₹${fmtPrice(prediction.expectedHigh, 1)}`} />
          <Row label="Reference price" value={`₹${fmtPrice(prediction.refPrice, 1)}`} />
          <Row label="Prediction time" value={`${fmtTime(prediction.createdAt, true)} IST`} />
          <Row label="Resolves at" value={`${fmtTime(prediction.targetTime, true)} IST`} />
          <Row label="Model" value={prediction.model} />
        </dl>

        {lastSettled && (
          <div
            className={cn(
              "mt-3 rounded-sm border px-2.5 py-2",
              lastSettled.outcome === "CORRECT" ? "border-bull/35 bg-bull-soft" : "border-bear/35 bg-bear-soft",
            )}
          >
            <div className="label-xs">Previous candle result</div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="num">
                Predicted <strong>{lastSettled.direction}</strong> @ {lastSettled.confidence}%
              </span>
              <span className="num">
                Actual <strong>{lastSettled.actualDirection}</strong>
              </span>
              <span
                className={cn(
                  "num font-semibold",
                  lastSettled.outcome === "CORRECT" ? "text-bull" : "text-bear",
                )}
              >
                {lastSettled.outcome === "CORRECT" ? "✓ CORRECT" : "✕ WRONG"}
              </span>
            </div>
          </div>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Probabilistic output from a simulated model. Not a guarantee and not financial advice.
        </p>
      </div>
    </Panel>
  );
}

function ProbBar({ label, value, tone }: { label: string; value: number; tone: "bull" | "bear" }) {
  return (
    <div className="rounded-sm border border-border bg-panel-2 px-2 py-1.5">
      <div className="label-xs">{label}</div>
      <div className={cn("num mt-0.5 text-sm font-semibold", tone === "bull" ? "text-bull" : "text-bear")}>
        {value}%
      </div>
      <div className="mt-1 h-[2px] w-full bg-border">
        <div
          className={cn("h-full transition-all duration-700", tone === "bull" ? "bg-bull" : "bg-bear")}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
