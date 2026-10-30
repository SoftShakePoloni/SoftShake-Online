"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { PublicDataContext } from "@/context/PublicDataContext";
import type { Category, Product } from "@/data/tipos";
import { hasProductPromo } from "@/data/tipos";

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
let bootstrapped = false;
let loadSeq = 0;
let menuRequest: Promise<Category[]> | null = null;
let promoCountRequest: Promise<number> | null = null;
let menuCache: Category[] | null = null;
let menuCacheAt = 0;
let promoCountCache: number | null = null;
let promoCountCacheAt = 0;

function requestMenu() {
  // Cache aumentado para 5 minutos (era 30 segundos)
  if (menuCache && Date.now() - menuCacheAt < 5 * 60_000) {
    return Promise.resolve(menuCache);
  }
  if (!menuRequest) {
    menuRequest = fetch("/api/cardapio", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Não foi possível carregar o cardápio.");
        const { categorias } = (await response.json()) as {
          categorias: Category[];
        };
        menuCache = categorias;
        menuCacheAt = Date.now();
        return categorias;
      })
      .finally(() => {
        menuRequest = null;
      });
  }
  return menuRequest;
}

function requestPromoCount() {
  // Cache aumentado para 5 minutos (era 30 segundos)
  if (promoCountCache !== null && Date.now() - promoCountCacheAt < 5 * 60_000) {
    return Promise.resolve(promoCountCache);
  }
  if (!promoCountRequest) {
    promoCountRequest = fetch("/api/promocoes/contagem", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Não foi possível contar as promoções.");
        const data = (await response.json()) as { count: number };
        promoCountCache = data.count;
        promoCountCacheAt = Date.now();
        return data.count;
      })
      .finally(() => {
        promoCountRequest = null;
      });
  }
  return promoCountRequest;
}

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
    const menu = await requestMenu();
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

function ensureMenuLoaded() {
  if (bootstrapped) return;
  bootstrapped = true;

  if (store.isLoading) void loadMenu();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void loadMenu();
  });
  // Polling reduzido de 60 segundos para 5 minutos
  window.setInterval(() => {
    if (document.visibilityState === "visible") void loadMenu();
  }, 5 * 60_000);
}

function subscribe(listener: () => void) {
  ensureMenuLoaded();
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
    c.products.filter((p) => hasProductPromo(p) && p.disponivel !== false),
  );
}

/**
 * Cardápio público carregado pelo backend e compartilhado entre as telas.
 */
export function useMenu() {
  const initial = useContext(PublicDataContext);
  const initialSnapshot = useMemo(
    () =>
      initial?.categories
        ? {
            ...SERVER_SNAPSHOT,
            categories: initial.categories,
            isLoading: false,
          }
        : SERVER_SNAPSHOT,
    [initial],
  );
  const primeInitialMenu = useCallback(() => {
    if (initial?.categories && initial.generatedAt > menuCacheAt) {
      menuCache = initial.categories;
      menuCacheAt = initial.generatedAt;
      store = {
        ...store,
        categories: initial.categories,
        isLoading: false,
        error: null,
      };
      emit();
    }
  }, [initial]);
  const subscribeWithInitial = useCallback(
    (listener: () => void) => {
      primeInitialMenu();
      return subscribe(listener);
    },
    [primeInitialMenu],
  );

  useEffect(() => {
    primeInitialMenu();
    ensureMenuLoaded();
  }, [primeInitialMenu]);

  const snap = useSyncExternalStore(
    subscribeWithInitial,
    getSnapshot,
    () => initialSnapshot,
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
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadCount = async () => {
      try {
        const promoCount = await requestPromoCount();
        if (active) setCount(promoCount);
      } catch {
        // A navegação continua funcional mesmo se o badge não puder atualizar.
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadCount();
    // Polling reduzido de 60 segundos para 5 minutos
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadCount();
    }, 5 * 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { count, isLoading };
}
