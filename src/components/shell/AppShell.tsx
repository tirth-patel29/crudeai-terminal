import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Wifi, WifiOff, X } from "lucide-react";
import { GROUP_LABEL, MOBILE_NAV, NAV } from "./nav";
import { ModeSwitcher } from "./ModeSwitcher";
import { Logo, StatusDot, Tag } from "@/components/common/Bits";
import { useMarket } from "@/hooks/useMarket";
import { useAuth } from "@/context/auth";
import { marketDataService } from "@/services";
import { fmtInr, fmtPct, fmtPrice, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: ReactNode }) {
  const market = useMarket();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = ["monitor", "trade", "analyse", "system"] as const;
  const up = market.market.changePct >= 0;
  const connected = market.market.connection === "CONNECTED";
  const activeAlerts = market.alerts.filter((a) => a.enabled).length;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>
        <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((g) => (
          <div key={g} className="mb-3">
            <div className="label-xs px-2 pb-1">{GROUP_LABEL[g]}</div>
            {NAV.filter((n) => n.group === g).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-sm px-2 py-[7px] text-[13px] transition-colors",
                    active
                      ? "bg-panel-2 text-foreground"
                      : "text-muted-foreground hover:bg-panel-2/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-[2px] rounded-full transition-colors",
                      active ? "bg-ai" : "bg-transparent",
                    )}
                  />
                  <Icon className="h-[15px] w-[15px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center justify-between rounded-sm border border-bull/30 bg-bull-soft px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bull">Paper trading</span>
          <StatusDot tone="bull" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-medium">{user?.name ?? "Guest"}</div>
            <div className="truncate text-[10px] text-muted-foreground">{user?.email ?? "not signed in"}</div>
          </div>
          <button
            aria-label="Log out"
            className="rounded-sm border border-border p-1.5 text-muted-foreground transition-colors hover:text-bear"
            onClick={() => {
              signOut();
              void navigate({ to: "/" });
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[212px] shrink-0 border-r border-border bg-panel lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[240px] border-r border-border bg-panel">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-panel/95 px-3 backdrop-blur">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="h-4.5 w-4.5 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold tracking-[0.1em]">MCX CRUDE OIL</span>
                <Tag tone={connected ? "bear" : "muted"} className="px-1 py-0">
                  <StatusDot tone={connected ? "bear" : "muted"} /> Live
                </Tag>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn("num text-sm font-semibold", up ? "text-bull" : "text-bear")}>
                  ₹{fmtPrice(market.market.price, 1)}
                </span>
                <span className={cn("num text-[11px]", up ? "text-bull" : "text-bear")}>
                  {fmtPct(market.market.changePct)}
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-3 text-[10px] text-muted-foreground md:flex">
              <span className="num">H {fmtPrice(market.market.dayHigh, 1)}</span>
              <span className="num">L {fmtPrice(market.market.dayLow, 1)}</span>
              <span className="num">{fmtTime(market.candles[market.candles.length - 1]?.time ?? 0, true)} IST</span>
            </div>

            <div
              className={cn(
                "hidden items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.1em] sm:flex",
                connected ? "border-bull/30 text-bull" : "border-bear/40 text-bear",
              )}
            >
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? "Connected" : "Disconnected"}
            </div>

            <ModeSwitcher mode={market.mode} className="hidden sm:flex" />

            <Link
              to="/alerts"
              className="relative rounded-sm border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Alerts"
            >
              <Bell className="h-3.5 w-3.5" />
              {activeAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ai text-[8px] font-bold text-background">
                  {activeAlerts}
                </span>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-panel-2 text-[11px] font-semibold">
                  {(user?.name ?? "G").charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">
                  <div>{user?.name}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="text-xs">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    marketDataService.setConnection(connected ? "DISCONNECTED" : "CONNECTED")
                  }
                >
                  {connected ? "Simulate disconnect" : "Reconnect feed"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs text-bear"
                  onClick={() => {
                    signOut();
                    void navigate({ to: "/" });
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {!connected && (
          <div className="flex items-center justify-between gap-3 border-b border-bear/40 bg-bear-soft px-4 py-2 text-xs text-bear">
            <span>
              <strong>Data disconnected.</strong> Market data connection has been interrupted. Predictions are paused.
            </span>
            <Button size="sm" variant="outline" onClick={() => marketDataService.setConnection("CONNECTED")}>
              Reconnect
            </Button>
          </div>
        )}

        <main className="min-w-0 flex-1 p-3 pb-20 lg:pb-3">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-panel lg:hidden">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px]",
                  active ? "text-ai" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.short}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PnlPill({ value }: { value: number }) {
  return (
    <span className={cn("num text-sm font-semibold", value >= 0 ? "text-bull" : "text-bear")}>
      {fmtInr(value)}
    </span>
  );
}
