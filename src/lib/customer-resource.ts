"use client";
import { useCallback, useSyncExternalStore } from "react";

export const STALE_MS = 30_000;
export const GC_MS = 10 * 60_000;
const DETACH_MS = 3_000,
  STREAM_GRACE_MS = 45_000;
type Snapshot<T> = { data: T | null; loading: boolean; error: string | null };
type Scope = {
  id?: string;
  ids?: string[];
  version?: string;
  catchup?: boolean;
};
type Reason = "mount" | "stale" | "invalidate" | "recovery" | "manual";
type Entry = {
  snapshot: Snapshot<unknown>;
  listeners: Set<() => void>;
  at: number;
  version: string;
  revision: number;
  rerun: boolean;
  intervalMs: number;
  lastAttempt: number;
  request?: Promise<void>;
  controller?: AbortController;
  gc?: ReturnType<typeof setTimeout>;
  detach?: ReturnType<typeof setTimeout>;
};
const entries = new Map<string, Entry>();
const identityListeners = new Set<() => void>();
const empty: Snapshot<never> = { data: null, loading: true, error: null };
let identity: string | null = null;
let source: EventSource | undefined;
let liveSince = 0,
  failedAt = 0,
  lastEventVersion = "",
  retryDelay = 1_000;
let retry: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let recovery: ReturnType<typeof setInterval> | undefined;
let debounce: ReturnType<typeof setTimeout> | undefined;
let pendingScope: Scope | undefined;
let eventsAttached = false;
const debugCounts = new Map<string, number>();
function debug(url: string, reason: Reason) {
  if (process.env.NODE_ENV === "production") return;
  const count = (debugCounts.get(url) ?? 0) + 1;
  debugCounts.set(url, count);
  console.debug("[customer-resource]", { url, reason, count });
}
function hasReaders() {
  return [...entries.values()].some((entry) => entry.listeners.size);
}
function notify(entry: Entry) {
  entry.listeners.forEach((fn) => fn());
}
function entryFor(key: string, intervalMs = STALE_MS) {
  let entry = entries.get(key);
  if (!entry) {
    entry = {
      snapshot: empty,
      listeners: new Set(),
      at: 0,
      version: "",
      revision: 0,
      rerun: false,
      intervalMs,
      lastAttempt: 0,
    };
    entries.set(key, entry);
  }
  return entry;
}
function stopRecovery() {
  clearInterval(recovery);
  recovery = undefined;
}
function startRecovery() {
  if (recovery || liveSince || !hasReaders()) return;
  recovery = setInterval(() => {
    if (
      document.visibilityState === "hidden" ||
      liveSince ||
      !identity ||
      Date.now() - failedAt < 15_000
    )
      return;
    for (const [key, entry] of entries) {
      if (
        entry.listeners.size &&
        Date.now() - entry.lastAttempt >= entry.intervalMs
      ) {
        const [, url] = JSON.parse(key) as [string, string];
        void load(identity, key, url, true, "recovery");
      }
    }
  }, 5_000);
}
function closeSource() {
  source?.close();
  source = undefined;
  liveSince = 0;
}
function stopEvents() {
  closeSource();
  clearTimeout(retry);
  clearTimeout(closeTimer);
  clearTimeout(debounce);
  retry = closeTimer = debounce = undefined;
  pendingScope = undefined;
  stopRecovery();
  if (eventsAttached) {
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("online", online);
    eventsAttached = false;
  }
}
function visibility() {
  if (document.visibilityState === "hidden") {
    closeSource();
    clearTimeout(retry);
    retry = undefined;
    stopRecovery();
  } else {
    failedAt = Date.now();
    connect();
    startRecovery();
  }
}
function online() {
  if (!liveSince) {
    clearTimeout(retry);
    retry = undefined;
    connect();
  }
}
function scheduleRetry() {
  if (retry || !identity || document.visibilityState === "hidden") return;
  retry = setTimeout(() => {
    retry = undefined;
    connect();
  }, retryDelay);
  retryDelay = Math.min(30_000, retryDelay * 2);
}
function loseConnection() {
  closeSource();
  if (!failedAt) failedAt = Date.now();
  startRecovery();
  scheduleRetry();
}
function connect() {
  if (
    source ||
    !identity ||
    document.visibilityState === "hidden" ||
    typeof EventSource === "undefined"
  )
    return;
  const owner = identity,
    connectedAt = Date.now();
  const current = new EventSource(
    "/api/pedidos/eventos?version=" + encodeURIComponent(lastEventVersion),
  );
  source = current;
  current.addEventListener("ready", (event) => {
    if (source !== current || identity !== owner) return;
    try {
      const message = event as MessageEvent<string>;
      if (JSON.parse(message.data).owner !== owner) {
        expireIdentity();
        return;
      }
      const initial = !lastEventVersion;
      lastEventVersion = message.lastEventId;
      liveSince = Date.now();
      failedAt = 0;
      retryDelay = 1_000;
      stopRecovery();
      // A first connection establishes a baseline, not a second invalidation.
      for (const entry of entries.values()) {
        if (
          entry.at > 0 &&
          (entry.version === lastEventVersion ||
            (initial && entry.at >= connectedAt))
        ) {
          entry.at = liveSince;
          entry.version = lastEventVersion;
        }
      }
    } catch {
      loseConnection();
    }
  });
  current.addEventListener("changed", (event) => {
    if (source !== current || identity !== owner) return;
    const message = event as MessageEvent<string>;
    if (message.lastEventId && message.lastEventId === lastEventVersion) return;
    let scope: Scope;
    try {
      scope = JSON.parse(message.data) as Scope;
    } catch {
      return;
    }
    scope.version = message.lastEventId;
    lastEventVersion = message.lastEventId;
    const ids = [
      ...new Set([
        ...(pendingScope?.ids ?? []),
        ...(scope.ids ?? []),
        ...(scope.id ? [scope.id] : []),
      ]),
    ];
    pendingScope = {
      ids,
      version: scope.version,
      catchup: scope.catchup || pendingScope?.catchup || ids.length === 0,
    };
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const affected = pendingScope;
      pendingScope = undefined;
      if (identity === owner) invalidateCustomerResources(affected);
    }, 300);
  });
  current.addEventListener("unavailable", () => {
    if (source === current) loseConnection();
  });
  current.onerror = () => {
    if (source === current) loseConnection();
  };
}
function ensureEvents() {
  clearTimeout(closeTimer);
  closeTimer = undefined;
  if (!identity || !hasReaders()) return;
  if (!eventsAttached) {
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", online);
    eventsAttached = true;
  }
  if (!failedAt && !liveSince) failedAt = Date.now();
  if (!retry) connect();
  startRecovery();
}
function releaseEvents() {
  if (!hasReaders()) {
    stopRecovery();
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!hasReaders()) stopEvents();
    }, STREAM_GRACE_MS);
  }
}
export function setCustomerResourceIdentity(next: string | null) {
  if (identity === next) return;
  stopEvents();
  identity = next;
  lastEventVersion = "";
  failedAt = 0;
  retryDelay = 1_000;
  for (const entry of entries.values()) {
    entry.controller?.abort();
    clearTimeout(entry.gc);
    clearTimeout(entry.detach);
  }
  entries.clear();
  debugCounts.clear();
  identityListeners.forEach((fn) => fn());
}
function expireIdentity() {
  setCustomerResourceIdentity(null);
  window.dispatchEvent(new Event("softshake-customer-session-changed"));
}
function invalidate(key: string, entry: Entry, version = "") {
  if (version && entry.version === version && entry.at > 0) return;
  entry.at = 0;
  entry.revision++;
  if (!entry.listeners.size || !identity) return;
  const [, url] = JSON.parse(key) as [string, string];
  if (entry.request) entry.rerun = true;
  else void load(identity, key, url, true, "invalidate");
}
export function invalidateCustomerResources(scope?: Scope) {
  const ids = new Set([
    ...(scope?.ids ?? []),
    ...(scope?.id ? [scope.id] : []),
  ]);
  for (const [key, entry] of entries) {
    const [, url] = JSON.parse(key) as [string, string];
    const parsed = new URL(url, "http://store.local");
    if (
      parsed.pathname === "/api/pedidos/detalhe" &&
      ids.size &&
      !scope?.catchup &&
      !ids.has(parsed.searchParams.get("id") ?? "")
    )
      continue;
    invalidate(key, entry, scope?.version);
  }
}
export function invalidateCustomerOrderDetail(
  owner: string,
  id: string,
  version: string,
) {
  if (identity !== owner) return;
  const key = JSON.stringify([
      owner,
      "/api/pedidos/detalhe?id=" + encodeURIComponent(id),
    ]),
    entry = entries.get(key);
  if (!entry) return;
  const data = entry.snapshot.data as {
    pedido?: { status?: string; updated_at?: string };
  } | null;
  if (
    data?.pedido &&
    data.pedido.status + ":" + (data.pedido.updated_at ?? "") === version
  )
    return;
  invalidate(key, entry);
}
async function load(
  owner: string,
  key: string,
  url: string,
  force = false,
  reason: Reason = "mount",
): Promise<void> {
  if (identity !== owner) return;
  const entry = entryFor(key);
  if (entry.request) return entry.request;
  if (
    !force &&
    entry.at > 0 &&
    ((liveSince > 0 && entry.at >= liveSince) ||
      Date.now() - entry.at < STALE_MS)
  )
    return;
  const controller = new AbortController(),
    revision = entry.revision,
    version = lastEventVersion;
  entry.controller = controller;
  entry.lastAttempt = Date.now();
  debug(url, force ? reason : entry.snapshot.data ? "stale" : "mount");
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
      if (!current()) return;
      if (response.status === 401) {
        expireIdentity();
        return;
      }
      const responseOwner = response.headers.get("x-customer-id");
      if (responseOwner && responseOwner !== owner) {
        expireIdentity();
        return;
      }
      if (!response.ok) {
        const message =
          response.status === 403
            ? "Você não tem permissão para consultar este pedido."
            : response.status === 404
              ? "Pedido não encontrado."
              : "Não foi possível carregar seus pedidos. Tente novamente.";
        entry.snapshot = {
          data: [403, 404].includes(response.status)
            ? null
            : entry.snapshot.data,
          loading: false,
          error: message,
        };
        return;
      }
      const data: unknown = await response.json();
      if (!current()) return;
      entry.at = entry.revision === revision ? Date.now() : 0;
      entry.version = version || lastEventVersion;
      entry.snapshot = { data, loading: false, error: null };
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
      if (current()) {
        notify(entry);
        if (entry.rerun) {
          entry.rerun = false;
          void load(owner, key, url, true, "invalidate");
        }
      }
    }
  })();
  return entry.request;
}
export function useCustomerResource<T>(
  owner: string | null | undefined,
  url: string,
  intervalMs = STALE_MS,
) {
  const key = JSON.stringify([owner, url]);
  const subscribe = useCallback(
    (listener: () => void) => {
      let attached: Entry | undefined;
      const attach = () => {
        if (attached) attached.listeners.delete(listener);
        attached = undefined;
        if (owner && identity === owner) {
          const entry = entryFor(key, intervalMs);
          attached = entry;
          clearTimeout(entry.gc);
          clearTimeout(entry.detach);
          entry.listeners.add(listener);
          ensureEvents();
          void load(owner, key, url);
        }
        listener();
      };
      identityListeners.add(attach);
      attach();
      return () => {
        identityListeners.delete(attach);
        const entry = attached;
        if (!entry) return;
        entry.listeners.delete(listener);
        if (!entry.listeners.size) {
          entry.detach = setTimeout(() => {
            if (!entry.listeners.size && entries.get(key) === entry) {
              entry.controller?.abort();
              entry.request = undefined;
            }
          }, DETACH_MS);
          entry.gc = setTimeout(() => {
            if (!entry.listeners.size && entries.get(key) === entry)
              entries.delete(key);
          }, GC_MS);
        }
        releaseEvents();
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
    () => (owner ? load(owner, key, url, true, "manual") : Promise.resolve()),
    [owner, key, url],
  );
  return { ...snapshot, reload };
}
