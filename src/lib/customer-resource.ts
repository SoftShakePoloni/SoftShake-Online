"use client";
import { useCallback, useSyncExternalStore } from "react";
type Snapshot<T> = { data: T | null; loading: boolean; error: string | null };
type Entry = {
  snapshot: Snapshot<unknown>;
  listeners: Set<() => void>;
  controller?: AbortController;
  request?: Promise<void>;
  at: number;
  timer?: ReturnType<typeof setInterval>;
  gc?: ReturnType<typeof setTimeout>;
  resume?: () => void;
};
const entries = new Map<string, Entry>();
let identity: string | null = null;
const empty: Snapshot<never> = { data: null, loading: true, error: null };
export function setCustomerResourceIdentity(next: string | null) {
  if (identity === next) return;
  identity = next;
  for (const entry of entries.values()) {
    entry.controller?.abort();
    clearInterval(entry.timer);
    clearTimeout(entry.gc);
    if (entry.resume) {
      document.removeEventListener("visibilitychange", entry.resume);
      window.removeEventListener("online", entry.resume);
    }
    entry.snapshot = empty;
    entry.listeners.forEach((fn) => fn());
  }
  entries.clear();
}
function entryFor(key: string) {
  let entry = entries.get(key);
  if (!entry) {
    entry = { snapshot: empty, listeners: new Set(), at: 0 };
    entries.set(key, entry);
  }
  return entry;
}
export function invalidateCustomerOrderDetail(owner: string, id: string, version: string) {
  const url = "/api/pedidos/detalhe?id=" + encodeURIComponent(id);
  const key = JSON.stringify([owner, url]), entry = entries.get(key);
  if (!entry) return;
  const data = entry.snapshot.data as { pedido?: { updated_at?: string; status?: string } } | null;
  if (data?.pedido && data.pedido.status + ":" + (data.pedido.updated_at ?? "") === version) return;
  entry.at = 0;
  entry.controller?.abort(); entry.request = undefined;
  entry.snapshot = { data: null, loading: true, error: null };
  entry.listeners.forEach(fn => fn());
  if (entry.listeners.size) void load(owner, key, url, true);
}
export function invalidateCustomerResources() {
  for (const [key, entry] of entries) {
    entry.at = 0;
    if (entry.listeners.size && identity) {
      const [, url] = JSON.parse(key) as [string, string];
      const owner = identity;
      if (entry.request)
        void entry.request.then(() => load(owner, key, url, true));
      else void load(identity, key, url, true);
    }
  }
}
async function load(owner: string, key: string, url: string, force = false) {
  if (identity !== owner) return;
  const entry = entryFor(key);
  if (entry.request) return entry.request;
  if (!force && Date.now() - entry.at < 30_000) return;
  const controller = new AbortController();
  entry.controller = controller;
  const current = () =>
    !controller.signal.aborted &&
    identity === owner &&
    entries.get(key) === entry;
  entry.request = (async () => {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        if ([401, 403, 404].includes(response.status) && current())
          entry.snapshot = {
            data: null,
            loading: false,
            error: "Entre novamente para consultar seus pedidos.",
          };
        throw new Error(
          "Não foi possível carregar seus pedidos. Tente novamente.",
        );
      }
      const responseOwner = response.headers.get("x-customer-id");
      if (current() && responseOwner && responseOwner !== owner) {
        setCustomerResourceIdentity(null);
        window.dispatchEvent(new Event("softshake-customer-session-changed"));
        return;
      }
      const data: unknown = await response.json();
      if (current()) {
        entry.at = Date.now();
        entry.snapshot = { data, loading: false, error: null };
      }
    } catch (error) {
      if (current())
        entry.snapshot = {
          ...entry.snapshot,
          loading: false,
          error: error instanceof Error ? error.message : "Erro de conexão.",
        };
    } finally {
      if (entry.controller === controller) {
        entry.request = undefined;
        entry.controller = undefined;
      }
      if (current()) entry.listeners.forEach((fn) => fn());
    }
  })();
  return entry.request;
}
export function useCustomerResource<T>(
  owner: string | null | undefined,
  url: string,
  intervalMs = 30_000,
) {
  const key = JSON.stringify([owner, url]);
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!owner || identity !== owner) return () => {};
      const entry = entryFor(key);
      clearTimeout(entry.gc);
      entry.listeners.add(listener);
      if (!entry.timer) {
        const resume = () => {
          if (document.visibilityState !== "hidden") void load(owner, key, url);
        };
        entry.resume = resume;
        entry.timer = setInterval(resume, intervalMs);
        document.addEventListener("visibilitychange", resume);
        window.addEventListener("online", resume);
      }
      void load(owner, key, url);
      return () => {
        entry.listeners.delete(listener);
        if (!entry.listeners.size) {
          clearInterval(entry.timer);
          entry.timer = undefined;
          if (entry.resume) {
            document.removeEventListener("visibilitychange", entry.resume);
            window.removeEventListener("online", entry.resume);
          }
          entry.controller?.abort();
          entry.request = undefined;
          entry.gc = setTimeout(() => {
            if (entries.get(key) === entry && !entry.listeners.size)
              entries.delete(key);
          }, 60_000);
        }
      };
    },
    [owner, key, url, intervalMs],
  );
  const getSnapshot = useCallback(
    () =>
      owner && identity === owner
        ? (entryFor(key).snapshot as Snapshot<T>)
        : (empty as Snapshot<T>),
    [owner, key],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => empty as Snapshot<T>,
  );
  const reload = useCallback(
    () => (owner ? load(owner, key, url, true) : Promise.resolve()),
    [owner, key, url],
  );
  return { ...snapshot, reload };
}
