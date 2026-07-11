"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ConfiguracoesLoja = {
  id: number;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  banner_url: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  horario_abertura: string | null;
  horario_fechamento: string | null;
  dias_funcionamento: string | null;
  taxa_entrega: number;
  pedido_minimo: number;
  tempo_entrega_min: number | null;
  tempo_entrega_max: number | null;
  esta_aberto: boolean;
  aceitar_pedidos_automaticamente?: boolean;
  aceitando_pedidos?: boolean;
};

type LojaStore = {
  loja: ConfiguracoesLoja | null;
  isLoading: boolean;
  live: boolean;
};

async function resolveImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const res = await fetch(`/api/imagem?path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

async function hydrateLoja(
  data: Record<string, unknown>
): Promise<ConfiguracoesLoja> {
  const logoPath = (data.logo_url as string | null) ?? null;
  const bannerPath = (data.banner_url as string | null) ?? null;
  const [logoResolvida, bannerResolvido] = await Promise.all([
    resolveImageUrl(logoPath),
    resolveImageUrl(bannerPath),
  ]);

  return {
    ...(data as unknown as ConfiguracoesLoja),
    logo_url: logoResolvida,
    banner_url: bannerResolvido,
  };
}

/**
 * Store global + 1 único canal Realtime.
 * Evita o erro "cannot add postgres_changes after subscribe"
 * quando vários componentes chamam useLoja() ao mesmo tempo.
 */
let store: LojaStore = {
  loja: null,
  isLoading: true,
  live: false,
};

const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;
let bootstrapped = false;
let hydrateSeq = 0;

function emit() {
  listeners.forEach((l) => l());
}

function setStore( partial: Partial<LojaStore>) {
  store = { ...store, ...partial };
  emit();
}

async function applyRow(raw: Record<string, unknown> | null) {
  if (!raw) {
    setStore({ loja: null, isLoading: false });
    return;
  }
  const seq = ++hydrateSeq;
  const hydrated = await hydrateLoja(raw);
  // ignora resposta antiga se chegou outra mais nova
  if (seq !== hydrateSeq) return;
  setStore({ loja: hydrated, isLoading: false });
}

function ensureLojaRealtime() {
  if (bootstrapped) return;
  bootstrapped = true;

  void (async () => {
    try {
      const { data } = await supabase
        .from("configuracoes_loja")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) await applyRow(data as Record<string, unknown>);
      else setStore({ isLoading: false });
    } catch {
      setStore({ isLoading: false });
    }
  })();

  // Nome fixo e canal único no app inteiro
  channel = supabase
    .channel("cardapio-cliente-loja-shared")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "configuracoes_loja",
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          setStore({ loja: null });
          return;
        }
        void applyRow(payload.new as Record<string, unknown> | null);
      }
    )
    .subscribe((status) => {
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
  ensureLojaRealtime();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): LojaStore {
  return store;
}

/** Referência estável — React exige cache no getServerSnapshot */
const SERVER_SNAPSHOT: LojaStore = {
  loja: null,
  isLoading: true,
  live: false,
};

function getServerSnapshot(): LojaStore {
  return SERVER_SNAPSHOT;
}

/**
 * Configurações da loja no cardápio + Realtime (compartilhado).
 */
export function useLoja() {
  // bootstrap no cliente (único canal compartilhado)
  useEffect(() => {
    ensureLojaRealtime();
  }, []);

  const snap = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    loja: snap.loja,
    isLoading: snap.isLoading,
    live: snap.live,
  };
}
