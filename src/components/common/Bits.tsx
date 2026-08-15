import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-panel-2">
        <div className="h-3 w-[2px] bg-bull" />
        <div className="absolute h-[9px] w-[7px] rounded-[1px] border border-bull bg-bull/25" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-sm font-semibold tracking-tight">
            Crude<span className="text-ai">AI</span>
          </div>
          <div className="label-xs mt-[3px]">Quant terminal</div>
        </div>
      )}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
  dense = false,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  dense?: boolean;
}) {
  return (
    <section className={cn("panel flex min-h-0 flex-col", className)}>
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="label-xs">{title}</div>
          {action}
        </header>
      )}
      <div className={cn("min-h-0 flex-1", dense ? "p-2" : "p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatusDot({ tone = "bull" }: { tone?: "bull" | "bear" | "warn" | "ai" | "muted" }) {
  const map = {
    bull: "bg-bull",
    bear: "bg-bear",
    warn: "bg-warn",
    ai: "bg-ai",
    muted: "bg-muted-foreground",
  } as const;
  return <span className={cn("pulse-dot inline-block h-[6px] w-[6px] rounded-full", map[tone])} />;
}

export function Tag({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "bull" | "bear" | "warn" | "ai" | "muted";
  className?: string;
}) {
  const map = {
    bull: "border-bull/40 text-bull bg-bull-soft",
    bear: "border-bear/40 text-bear bg-bear-soft",
    warn: "border-warn/40 text-warn bg-warn-soft",
    ai: "border-ai/40 text-ai bg-ai-soft",
    muted: "border-border text-muted-foreground bg-panel-2",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-[2px] text-[10px] font-medium uppercase tracking-[0.08em]",
        map[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "bull" | "bear" | "warn" | "ai";
  footer?: ReactNode;
  className?: string;
}) {
  const toneMap = {
    default: "text-foreground",
    bull: "text-bull",
    bear: "text-bear",
    warn: "text-warn",
    ai: "text-ai",
  } as const;
  return (
    <div className={cn("panel px-3 py-2.5", className)}>
      <div className="label-xs">{label}</div>
      <div className={cn("num mt-1.5 text-xl font-semibold leading-none", toneMap[tone])}>{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}

export function ConfidenceMeter({
  value,
  direction,
  size = "md",
}: {
  value: number;
  direction: "UP" | "DOWN";
  size?: "sm" | "md";
}) {
  const color = direction === "UP" ? "var(--bull)" : "var(--bear)";
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className="label-xs">Confidence</span>
        <span className="num text-sm font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className={cn("mt-1.5 w-full overflow-hidden rounded-full bg-panel-2", size === "sm" ? "h-1" : "h-1.5")}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 12px -2px ${color}` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>50% coin-flip baseline</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SimBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-warn/40 bg-warn-soft px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.12em] text-warn",
        className,
      )}
    >
      <StatusDot tone="warn" /> Simulation
    </span>
  );
}
