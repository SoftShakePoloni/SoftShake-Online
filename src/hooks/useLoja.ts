"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { PublicDataContext } from "@/context/PublicDataContext";

export type ConfiguracoesLoja = {
  id: number;
  nome: string;
  descricao?: string | null;
  logo_url: string | null;
  banner_url: string | null;
  endereco?: string | null;
  cidade: string | null;
  estado: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  horario_abertura: string | null;
  horario_fechamento?: string | null;
  dias_funcionamento?: string | null;
  taxa_entrega: number;
  pedido_minimo?: number;
  tempo_entrega_min: number | null;
  tempo_entrega_max: number | null;
  esta_aberto: boolean;
  aceitar_pedidos_automaticamente?: boolean;
  aceitando_pedidos?: boolean;
};

type LojaStore = {
  loja: ConfiguracoesLoja | null;
  isLoading: boolean;
};

const SERVER_SNAPSHOT: LojaStore = { loja: null, isLoading: true };
let store = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let bootstrapped = false;
let inFlight: Promise<void> | null = null;
let initialAt = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

function setStore(partial: Partial<LojaStore>) {
  store = { ...store, ...partial };
  emit();
}

async function loadLoja() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const response = await fetch("/api/loja", { cache: "no-store" });
      if (!response.ok)
        throw new Error("Não foi possível carregar as informações da loja.");
      const { loja } = (await response.json()) as {
        loja: ConfiguracoesLoja | null;
      };
      setStore({ loja, isLoading: false });
    } catch {
      setStore({ isLoading: false });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function ensureLoaded() {
  if (bootstrapped) return;
  bootstrapped = true;
  if (store.isLoading) void loadLoja();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void loadLoja();
  });
  // Polling reduzido de 60 segundos para 10 minutos (dados da loja mudam raramente)
  window.setInterval(() => {
    if (document.visibilityState === "visible") void loadLoja();
  }, 10 * 60_000);
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLoja() {
  const initial = useContext(PublicDataContext);
  const initialSnapshot = useMemo(
    () =>
      initial?.loja !== undefined
        ? { loja: initial.loja, isLoading: false }
        : SERVER_SNAPSHOT,
    [initial],
  );
  const primeInitialLoja = useCallback(() => {
    if (initial?.loja !== undefined && initial.generatedAt > initialAt) {
      initialAt = initial.generatedAt;
      store = { loja: initial.loja, isLoading: false };
      emit();
    }
  }, [initial]);
  const subscribeWithInitial = useCallback(
    (listener: () => void) => {
      primeInitialLoja();
      return subscribe(listener);
    },
    [primeInitialLoja],
  );

  useEffect(() => {
    primeInitialLoja();
    ensureLoaded();
  }, [primeInitialLoja]);

  const snapshot = useSyncExternalStore(
    subscribeWithInitial,
    () => store,
    () => initialSnapshot,
  );
  return { loja: snapshot.loja, isLoading: snapshot.isLoading, live: false };
}
