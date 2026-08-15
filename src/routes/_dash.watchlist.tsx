import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/Bits";
import { WatchlistPanel } from "@/components/terminal/Panels";
import { useMarket } from "@/hooks/useMarket";

export const Route = createFileRoute("/_dash/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — CrudeAI" },
      { name: "description", content: "Track simulated MCX and index quotes, star favourites and reorder your instrument list." },
      { property: "og:title", content: "Watchlist — CrudeAI" },
      { property: "og:description", content: "Track simulated MCX and index quotes, star favourites and reorder your instrument list." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const m = useMarket();
  return (
    <div>
      <PageHeader title="Watchlist" subtitle="Persisted locally · simulated quotes" />
      <div className="max-w-md"><WatchlistPanel items={m.watchlist} /></div>
    </div>
  );
}
