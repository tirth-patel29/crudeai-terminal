import { useEffect, useState } from "react";
import { getEngine, type EngineSnapshot } from "@/lib/engine";
import { marketDataService } from "@/services";

/** Subscribes the component tree to the mock market engine. */
export function useMarket(): EngineSnapshot {
  const [snap, setSnap] = useState<EngineSnapshot>(() => getEngine().snapshot());

  useEffect(() => {
    const unsub = marketDataService.subscribe(() => setSnap(getEngine().snapshot()));
    setSnap(getEngine().snapshot());
    return unsub;
  }, []);

  return snap;
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
