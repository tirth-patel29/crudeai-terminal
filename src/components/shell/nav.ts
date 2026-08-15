import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Clock,
  FlaskConical,
  LayoutDashboard,
  ListOrdered,
  Settings,
  Star,
  Target,
  Wallet,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: typeof Activity;
  group: "monitor" | "trade" | "analyse" | "system";
}

export const NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", short: "Home", icon: LayoutDashboard, group: "monitor" },
  { to: "/terminal", label: "Live Terminal", short: "Terminal", icon: Activity, group: "monitor" },
  { to: "/predictions", label: "AI Predictions", short: "AI", icon: Brain, group: "monitor" },
  { to: "/watchlist", label: "Watchlist", short: "Watch", icon: Star, group: "monitor" },
  { to: "/strategies", label: "Strategies", short: "Strategy", icon: Target, group: "trade" },
  { to: "/auto-trading", label: "Auto Trading", short: "Auto", icon: Bot, group: "trade" },
  { to: "/orders", label: "Orders", short: "Orders", icon: ListOrdered, group: "trade" },
  { to: "/positions", label: "Positions", short: "Positions", icon: Wallet, group: "trade" },
  { to: "/history", label: "Trade History", short: "History", icon: Clock, group: "trade" },
  { to: "/backtesting", label: "Backtesting", short: "Backtest", icon: FlaskConical, group: "analyse" },
  { to: "/performance", label: "Performance", short: "Stats", icon: BarChart3, group: "analyse" },
  { to: "/alerts", label: "Alerts", short: "Alerts", icon: Bell, group: "system" },
  { to: "/settings", label: "Settings", short: "Settings", icon: Settings, group: "system" },
];

export const GROUP_LABEL: Record<NavItem["group"], string> = {
  monitor: "Monitor",
  trade: "Execute",
  analyse: "Analyse",
  system: "System",
};

export const MOBILE_NAV = NAV.filter((n) =>
  ["/dashboard", "/terminal", "/predictions", "/positions", "/performance"].includes(n.to),
);
