"use client";

import { createClient } from "@/lib/supabase/client";

type Listener = () => void;
const listeners = new Set<Listener>();
let stop: (() => void) | undefined;
let removing: Promise<unknown> = Promise.resolve();

/** One shared connection for menu, store and navigation, with complete cleanup. */
export function subscribeCatalogUpdates(listener: Listener) {
  listeners.add(listener);
  if (!stop) {
    const supabase = createClient();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      if (debounce) return;
      debounce = setTimeout(() => { debounce = undefined; listeners.forEach(fn => fn()); }, 500);
    };
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    void removing.then(() => {
      if (cancelled) return;
      channel = supabase.channel("public-catalog")
        .on("broadcast", { event: "changed" }, refresh)
        .subscribe(status => { if (status === "SUBSCRIBED") refresh(); });
    });
    const timer = setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    refresh();
    stop = () => {
      clearTimeout(debounce); clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      cancelled = true;
      if (channel) removing = supabase.removeChannel(channel).catch(() => {});
      stop = undefined;
    };
  }
  return () => { listeners.delete(listener); if (!listeners.size) stop?.(); };
}
