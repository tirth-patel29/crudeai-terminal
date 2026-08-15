import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, Tag } from "@/components/common/Bits";
import { Button } from "@/components/ui/button";
import { OrderPanel } from "@/components/terminal/Panels";
import { useMarket } from "@/hooks/useMarket";
import { orderService } from "@/services";
import { fmtPrice, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/_dash/orders")({
  head: () => ({
    meta: [
      { title: "Orders — CrudeAI" },
      { name: "description", content: "Simulated order book: manual and automated paper orders with entry, stop and target levels." },
      { property: "og:title", content: "Orders — CrudeAI" },
      { property: "og:description", content: "Simulated order book: manual and automated paper orders with entry, stop and target levels." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const m = useMarket();
  return (
    <div>
      <PageHeader title="Orders" subtitle="Every order here is simulated" />
      <div className="grid gap-2 lg:grid-cols-[1fr_320px]">
        <Panel title="Order book" dense>
          {m.orders.length === 0 ? (
            <EmptyState title="No orders yet" body="Place a simulated order from the ticket or let auto trading generate one." />
          ) : (
            <table className="w-full text-[11px]">
              <thead><tr className="label-xs text-left"><th className="py-1">Time</th><th>Symbol</th><th>Side</th><th>Type</th><th>Qty</th><th>Price</th><th>SL</th><th>Target</th><th>Source</th><th>Status</th><th /></tr></thead>
              <tbody>
                {m.orders.map((o) => (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="num py-1.5">{fmtTime(o.time)}</td><td>{o.symbol}</td>
                    <td className={o.side === "LONG" ? "text-bull" : "text-bear"}>{o.side}</td>
                    <td>{o.type}</td><td className="num">{o.qty}</td>
                    <td className="num">{fmtPrice(o.price, 1)}</td><td className="num">{fmtPrice(o.stopLoss, 1)}</td><td className="num">{fmtPrice(o.target, 1)}</td>
                    <td><Tag tone={o.source === "AUTO" ? "ai" : "muted"}>{o.source}</Tag></td>
                    <td className="text-muted-foreground">{o.status}</td>
                    <td className="text-right">{o.status === "FILLED" && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => orderService.cancel(o.id)}>Cancel</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <OrderPanel price={m.market.price} />
      </div>
    </div>
  );
}
