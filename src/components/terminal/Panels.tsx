import { useState } from "react";
import { Check, Minus, Plus, Search, Star, Trash2, X } from "lucide-react";
import { EmptyState, Panel, Tag } from "@/components/common/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtInr, fmtPrice, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { orderService, portfolioService, watchlistService } from "@/services";
import type { Position, Prediction, Side, StrategySignal, WatchlistItem } from "@/types";

/* ------------------------------- Watchlist ------------------------------- */
export function WatchlistPanel({ items }: { items: WatchlistItem[] }) {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState("");
  const filtered = items.filter((i) => i.symbol.toLowerCase().includes(q.toLowerCase()));

  return (
    <Panel
      title="Watchlist"
      action={<Tag tone="muted">{items.length}</Tag>}
      dense
      bodyClassName="flex flex-col gap-2 overflow-y-auto"
    >
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbols"
          className="h-7 pl-7 text-xs"
        />
      </div>

      <div className="flex flex-col">
        {filtered.length === 0 && (
          <EmptyState title="No watchlist items" body="Add an instrument to start tracking simulated quotes." />
        )}
        {filtered.map((w) => (
          <div
            key={w.id}
            className={cn(
              "group flex items-center gap-2 rounded-sm px-2 py-1.5 transition-colors hover:bg-panel-2",
              w.primary && "border-l-2 border-ai bg-panel-2/60",
            )}
          >
            <button onClick={() => watchlistService.toggleStar(w.id)} aria-label="Star symbol">
              <Star className={cn("h-3 w-3", w.starred ? "fill-warn text-warn" : "text-muted-foreground")} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium">{w.symbol}</div>
              <div className="truncate text-[9px] text-muted-foreground">{w.name}</div>
            </div>
            <div className="text-right">
              <div className="num text-[11px]">{fmtPrice(w.price, 1)}</div>
              <div className={cn("num text-[9px]", w.changePct >= 0 ? "text-bull" : "text-bear")}>
                {w.changePct >= 0 ? "+" : ""}
                {w.changePct.toFixed(2)}%
              </div>
            </div>
            <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={() => watchlistService.move(w.id, -1)} aria-label="Move up">
                <Plus className="h-2.5 w-2.5 rotate-45 text-muted-foreground" />
              </button>
              <button onClick={() => watchlistService.remove(w.id)} aria-label="Remove">
                <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-bear" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          watchlistService.add(adding);
          setAdding("");
        }}
      >
        <Input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          placeholder="Add symbol"
          className="h-7 text-xs"
        />
        <Button type="submit" size="sm" variant="secondary" className="h-7 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </form>
    </Panel>
  );
}

/* ------------------------------ AI reasoning ----------------------------- */
export function ReasoningPanel({ prediction }: { prediction: Prediction | null }) {
  if (!prediction) return null;
  const confirmations = prediction.factors.filter((f) => f.bullish === (prediction.direction === "UP")).length;
  return (
    <Panel title="AI analysis" action={<Tag tone="ai">{confirmations} / {prediction.factors.length}</Tag>}>
      <div className="space-y-1">
        {prediction.factors.map((f) => {
          const aligned = f.bullish === (prediction.direction === "UP");
          return (
            <div key={f.label} className="flex items-center justify-between border-b border-border/60 py-1 last:border-0">
              <span className="text-[11px] text-muted-foreground">{f.label}</span>
              <span className="flex items-center gap-1.5">
                <span className="num text-[11px]">{f.value}</span>
                {f.bullish === null ? (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                ) : aligned ? (
                  <Check className="h-3 w-3 text-bull" />
                ) : (
                  <X className="h-3 w-3 text-bear" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ------------------------------- Strategy -------------------------------- */
export function StrategyPanel({
  signal,
  price,
  onCreateOrder,
}: {
  signal: StrategySignal;
  price: number;
  onCreateOrder?: (side: Side) => void;
}) {
  const [ignored, setIgnored] = useState(false);
  const verdictTone = signal.verdict === "LONG" ? "bull" : signal.verdict === "SHORT" ? "bear" : "warn";

  return (
    <Panel
      title="Strategy engine"
      action={<Tag tone={verdictTone}>{signal.verdict.replace("_", " ")}</Tag>}
    >
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{signal.strategyName}</div>

      <div className="mt-2 space-y-1">
        {signal.conditions.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-sm bg-panel-2/60 px-2 py-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              {c.passed ? <Check className="h-3 w-3 text-bull" /> : <X className="h-3 w-3 text-bear" />}
              {c.label}
            </span>
            <span className="num text-[10px] text-muted-foreground">{c.detail}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Confirmations</span>
        <span className="num">
          {signal.passedCount} / {signal.totalCount}
        </span>
      </div>

      {signal.setup && !ignored ? (
        <div className="mt-3 rounded-sm border border-border bg-panel-2 p-2.5">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Field label="Entry" value={`₹${fmtPrice(signal.setup.entryLow, 1)}–${fmtPrice(signal.setup.entryHigh, 1)}`} />
            <Field label="Stop loss" value={`₹${fmtPrice(signal.setup.stopLoss, 1)}`} tone="bear" />
            <Field label="Target 1" value={`₹${fmtPrice(signal.setup.target1, 1)}`} tone="bull" />
            <Field label="Target 2" value={`₹${fmtPrice(signal.setup.target2, 1)}`} tone="bull" />
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px]">
            <span className="text-muted-foreground">Risk / reward</span>
            <span className="num font-semibold">1 : {signal.setup.riskReward.toFixed(1)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              size="sm"
              className="h-7 flex-1 text-[11px]"
              onClick={() => onCreateOrder?.(signal.verdict === "LONG" ? "LONG" : "SHORT")}
            >
              Create order
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-[11px]" onClick={() => setIgnored(true)}>
              Ignore setup
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-sm border border-warn/35 bg-warn-soft p-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-warn">No trade</div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {ignored ? "Setup ignored for this candle. Waiting for the next signal." : signal.reason}
          </p>
          <p className="mt-1.5 num text-[10px] text-muted-foreground">Reference price ₹{fmtPrice(price, 1)}</p>
        </div>
      )}
    </Panel>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div>
      <div className="label-xs">{label}</div>
      <div className={cn("num text-[12px]", tone === "bull" && "text-bull", tone === "bear" && "text-bear")}>
        {value}
      </div>
    </div>
  );
}

/* ------------------------------- Order panel ----------------------------- */
export function OrderPanel({
  price,
  defaults,
}: {
  price: number;
  defaults?: { side: Side; stopLoss: number; target: number } | null;
}) {
  const [side, setSide] = useState<Side>(defaults?.side ?? "LONG");
  const [qty, setQty] = useState(1);
  const [entry, setEntry] = useState(price.toFixed(1));
  const [sl, setSl] = useState((defaults?.stopLoss ?? price - 16).toFixed(1));
  const [tg, setTg] = useState((defaults?.target ?? price + 34).toFixed(1));

  return (
    <Panel title="Order ticket" action={<Tag tone="warn">Paper</Tag>}>
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          size="sm"
          variant={side === "LONG" ? "default" : "secondary"}
          className={cn("h-7 text-[11px]", side === "LONG" && "bg-bull text-background hover:bg-bull/90")}
          onClick={() => setSide("LONG")}
        >
          BUY / LONG
        </Button>
        <Button
          size="sm"
          variant={side === "SHORT" ? "default" : "secondary"}
          className={cn("h-7 text-[11px]", side === "SHORT" && "bg-bear text-background hover:bg-bear/90")}
          onClick={() => setSide("SHORT")}
        >
          SELL / SHORT
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Num label="Quantity (lots)" value={String(qty)} onChange={(v) => setQty(Math.max(1, Number(v) || 1))} />
        <Num label="Entry" value={entry} onChange={setEntry} />
        <Num label="Stop loss" value={sl} onChange={setSl} />
        <Num label="Target" value={tg} onChange={setTg} />
      </div>

      <div className="mt-2 flex gap-1.5">
        <Button
          size="sm"
          className="h-7 flex-1 text-[11px]"
          onClick={() =>
            orderService.place({
              side,
              qty,
              price: Number(entry) || price,
              stopLoss: Number(sl),
              target: Number(tg),
            })
          }
        >
          Place simulated order
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-[11px]"
          onClick={() => {
            setEntry(price.toFixed(1));
            setSl((price - 16).toFixed(1));
            setTg((price + 34).toFixed(1));
          }}
        >
          Reset
        </Button>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Every order in this prototype is simulated. No broker is connected.
      </p>
    </Panel>
  );
}

function Num({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="label-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="num mt-1 h-7 text-xs" />
    </div>
  );
}

/* ------------------------------- Positions ------------------------------- */
export function PositionCard({ position }: { position: Position }) {
  const long = position.side === "LONG";
  return (
    <div className="panel p-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag tone={long ? "bull" : "bear"}>{position.side}</Tag>
          <span className="text-[11px] font-medium">{position.symbol}</span>
          <span className="text-[10px] text-muted-foreground">{position.qty} lot</span>
          {position.source === "AUTO" && <Tag tone="ai">Auto</Tag>}
        </div>
        <span className={cn("num text-sm font-semibold", position.pnl >= 0 ? "text-bull" : "text-bear")}>
          {fmtInr(position.pnl)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2 text-[11px]">
        <Field label="Entry" value={`₹${fmtPrice(position.entry, 1)}`} />
        <Field label="LTP" value={`₹${fmtPrice(position.ltp, 1)}`} />
        <Field label="Stop" value={`₹${fmtPrice(position.stopLoss, 1)}`} tone="bear" />
        <Field label="Target" value={`₹${fmtPrice(position.target, 1)}`} tone="bull" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button size="sm" variant="secondary" className="h-6 text-[10px]" onClick={() => portfolioService.close(position.id)}>
          Close position
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px]"
          onClick={() =>
            portfolioService.modify(position.id, {
              stopLoss: Number((position.stopLoss + (long ? 4 : -4)).toFixed(1)),
            })
          }
        >
          Trail SL
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px]"
          onClick={() =>
            portfolioService.modify(position.id, {
              target: Number((position.target + (long ? 8 : -8)).toFixed(1)),
            })
          }
        >
          Extend target
        </Button>
        <span className="ml-auto self-center text-[10px] text-muted-foreground">
          Opened {fmtTime(position.openedAt)}
        </span>
      </div>
    </div>
  );
}
