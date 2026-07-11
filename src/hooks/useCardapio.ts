"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { fetchMenu } from "@/data/cardapio";
import type { Category, Product } from "@/data/tipos";
import { hasProductPromo } from "@/data/tipos";
import { supabase } from "@/integrations/supabase/client";

const MENU_TABLES = [
  "produtos",
  "categorias",
  "tags",
  "grupos_opcoes",
  "opcoes",
  "produto_grupos",
] as const;

const DEBOUNCE_MS = 350;

type MenuStore = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  live: boolean;
};

let store: MenuStore = {
  categories: [],
  isLoading: true,
  error: null,
  live: false,
};

const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;
let bootstrapped = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let loadSeq = 0;

function emit() {
  listeners.forEach((l) => l());
}

function setStore(partial: Partial<MenuStore>) {
  store = { ...store, ...partial };
  emit();
}

async function loadMenu() {
  const seq = ++loadSeq;
  try {
    const menu = await fetchMenu();
    if (seq !== loadSeq) return;
    setStore({ categories: menu, error: null, isLoading: false });
  } catch (err: unknown) {
    if (seq !== loadSeq) return;
    const message =
      err instanceof Error
        ? err.message
        : "Não foi possível carregar o cardápio.";
    setStore({ error: message, isLoading: false });
  }
}

function scheduleReload() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void loadMenu();
  }, DEBOUNCE_MS);
}

function ensureMenuRealtime() {
  if (bootstrapped) return;
  bootstrapped = true;

  void loadMenu();

  let ch = supabase.channel("cardapio-cliente-menu-shared");
  for (const table of MENU_TABLES) {
    ch = ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => scheduleReload()
    );
  }
  channel = ch.subscribe((status) => {
    if (status === "SUBSCRIBED") setStore({ live: true });
    else if (
      status === "CHANNEL_ERROR" ||
      status === "TIMED_OUT" ||
      status === "CLOSED"
    ) {
      setStore({ live: false });
    }
  });
}

function subscribe(listener: () => void) {
  ensureMenuRealtime();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return store;
}

/** Referência estável (exigência do useSyncExternalStore no SSR) */
const SERVER_SNAPSHOT: MenuStore = {
  categories: [],
  isLoading: true,
  error: null,
  live: false,
};

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

/** Conta produtos com promoção ativa e disponíveis */
export function countPromocoesAtivas(categories: Category[]): number {
  let n = 0;
  for (const c of categories) {
    for (const p of c.products) {
      if (hasProductPromo(p) && p.disponivel !== false) n += 1;
    }
  }
  return n;
}

export function flattenPromoProducts(categories: Category[]): Product[] {
  return categories.flatMap((c) =>
    c.products.filter((p) => hasProductPromo(p) && p.disponivel !== false)
  );
}

/**
 * Cardápio do cliente com Realtime (store compartilhado).
 * Várias telas / nav usam o mesmo canal e os mesmos dados.
 */
export function useMenu() {
  useEffect(() => {
    ensureMenuRealtime();
  }, []);

  const snap = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const refresh = useCallback(() => loadMenu(), []);

  return {
    categories: snap.categories,
    isLoading: snap.isLoading,
    error: snap.error,
    live: snap.live,
    refresh,
  };
}

/** Quantidade de promoções ativas (para badge na navegação) */
export function usePromocoesCount() {
  const { categories, isLoading } = useMenu();
  return {
    count: countPromocoesAtivas(categories),
    isLoading,
  };
}
