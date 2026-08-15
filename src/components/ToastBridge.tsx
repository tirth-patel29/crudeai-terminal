import { useEffect } from "react";
import { toast } from "sonner";
import { getEngine } from "@/lib/engine";

/** Pipes mock-engine events into the toast system. */
export function ToastBridge() {
  useEffect(() => {
    const unsub = getEngine().onEvent((e) => {
      if (e.type !== "toast") return;
      const opts = e.body ? { description: e.body } : undefined;
      if (e.tone === "success") toast.success(e.title, opts);
      else if (e.tone === "error") toast.error(e.title, opts);
      else if (e.tone === "warn") toast.warning(e.title, opts);
      else toast(e.title, opts);
    });
    return () => {
      unsub();
    };
  }, []);
  return null;
}
