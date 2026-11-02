"use client";

import { createClient } from "@/lib/supabase/client";

export type CatalogUpdateReason = "initial" | "change" | "resume" | "fallback";
type Listener = (reason: CatalogUpdateReason) => void;
const listeners = new Set<Listener>();
let catalogVersion = 0;
export function getCatalogVersion() { return catalogVersion; }
let stop: (() => void) | undefined;
let removing: Promise<unknown> = Promise.resolve();

/** One shared connection for menu, store and navigation, with complete cleanup. */
export function subscribeCatalogUpdates(listener: Listener) {
  listeners.add(listener);
  if (!stop) {
    const supabase = createClient();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let pendingReason: CatalogUpdateReason = "initial";
    const priority = { initial: 0, fallback: 1, resume: 2, change: 3 };
    const refresh = (reason: CatalogUpdateReason = "change") => {
      if (reason === "change" || reason === "resume") catalogVersion++;
      if (document.visibilityState === "hidden") return;
      if (!debounce || priority[reason] > priority[pendingReason]) pendingReason = reason;
      if (debounce) return;
      debounce = setTimeout(() => { debounce = undefined; listeners.forEach(fn => fn(pendingReason)); }, 500);
    };
    const resume = () => refresh("resume");
    let connected = false;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    void removing.then(() => {
      if (cancelled) return;
      channel = supabase.channel("public-catalog")
        .on("broadcast", { event: "changed" }, () => refresh("change"))
        .subscribe(status => { if (status === "SUBSCRIBED") { refresh(connected ? "resume" : "initial"); connected = true; } });
    });
    const timer = setInterval(() => refresh("fallback"), 30_000);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    refresh("initial");
    stop = () => {
      clearTimeout(debounce); clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      cancelled = true;
      if (channel) removing = supabase.removeChannel(channel).catch(() => {});
      stop = undefined;
    };
  }
  return () => { listeners.delete(listener); if (!listeners.size) stop?.(); };
}
