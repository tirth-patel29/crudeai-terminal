import { useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TradingMode } from "@/types";

export function ModeSwitcher({ mode, className }: { mode: TradingMode; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={cn("flex items-center rounded-sm border border-border bg-panel-2 p-[2px]", className)}>
        <button
          type="button"
          className={cn(
            "rounded-[3px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors",
            mode === "PAPER" ? "bg-bull-soft text-bull" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => undefined}
        >
          Paper
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-[3px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-warn"
        >
          <Lock className="h-3 w-3" /> Live
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Live trading is disabled</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Live trading requires a connected broker, and real-money execution can result in financial loss.
              This prototype runs entirely on simulated market data.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-sm border border-warn/40 bg-warn-soft px-3 py-2 text-xs text-warn">
            Coming when broker integration is connected.
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Stay in paper mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
