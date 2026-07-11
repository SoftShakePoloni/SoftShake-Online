"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export type RealtimeConnectionStatus = "connecting" | "live" | "error";

export type PedidoRow = {
  id: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  tipo_entrega?: string | null;
  endereco_completo?: unknown;
  meio_pagamento?: string | null;
  troco_para?: number | string | null;
  subtotal?: number | null;
  taxa_entrega?: number | null;
  total?: number | null;
  itens?: unknown;
  status?: string | null;
  observacoes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

const CHANNEL_NAME = "admin-pedidos";
const HIGHLIGHT_MS = 6000;

/** Flag global de som (evita re-subscrever o canal a cada toggle) */
let pedidosSoundEnabled = true;

/** AudioContext reutilizável — precisa de gesto do usuário para sair de "suspended" */
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtx();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

async function ensureAudioUnlocked(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx.state === "running" ? ctx : null;
}

/**
 * Chamar em clique do admin (ex.: botão de som) para liberar o áudio no browser.
 * Sem isso, o Chrome/Edge bloqueiam som até haver interação.
 */
export async function unlockPedidosAudio(): Promise<boolean> {
  const ctx = await ensureAudioUnlocked();
  return Boolean(ctx);
}

export function setPedidosSoundEnabled(enabled: boolean) {
  pedidosSoundEnabled = enabled;
  if (enabled) {
    // Tenta desbloquear no mesmo stack do clique (gesto do usuário)
    void unlockPedidosAudio();
  }
}

export function getPedidosSoundEnabled() {
  return pedidosSoundEnabled;
}

/** Dois bipes curtos e mais audíveis (notificação de pedido) */
function playTone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak = 0.22
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startAt);

  // linearRamp evita erro do exponential com valores ~0
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

export async function playNewOrderSound() {
  if (!pedidosSoundEnabled) return;
  try {
    const ctx = await ensureAudioUnlocked();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Bipe 1 + bipe 2 (estilo alerta de pedido)
    playTone(ctx, 880, t, 0.14, 0.25);
    playTone(ctx, 1175, t + 0.16, 0.18, 0.28);
    playTone(ctx, 1319, t + 0.36, 0.22, 0.22);
  } catch {
    // som opcional — não quebra o fluxo
  }
}

/**
 * Realtime puro para a tabela `pedidos`.
 * - INSERT → prepend no state (sem refetch)
 * - UPDATE → patch só do item
 * - DELETE → remove do state
 * Sem polling / setInterval / refetch periódico.
 */
export function usePedidosRealtime(pedidosIniciais: PedidoRow[]) {
  // Snapshot inicial do SSR/RSC; daqui pra frente só payload Realtime
  const [pedidos, setPedidosState] = useState<PedidoRow[]>(() => pedidosIniciais);
  const [status, setStatus] =
    useState<RealtimeConnectionStatus>("connecting");
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(
    () => new Set()
  );

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const clearHighlight = useCallback((id: string) => {
    setHighlightedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const timer = highlightTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      highlightTimersRef.current.delete(id);
    }
  }, []);

  const markHighlight = useCallback(
    (id: string) => {
      setHighlightedIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      const existing = highlightTimersRef.current.get(id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        clearHighlight(id);
      }, HIGHLIGHT_MS);
      highlightTimersRef.current.set(id, timer);
    },
    [clearHighlight]
  );

  // Lista inicial só no useState — Realtime cuida do resto.
  // Não re-sincronizar com pedidosIniciais para não sobrescrever inserts ao vivo.

  useEffect(() => {
    // Canal único e estável
    const channel = supabase
      .channel(CHANNEL_NAME)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pedidos",
        },
        (payload) => {
          const row = payload.new as PedidoRow;
          if (!row?.id) return;

          setPedidosState((prev) => {
            // idempotência: se já existe, substitui; senão, topo da lista
            const idx = prev.findIndex((p) => p.id === row.id);
            if (idx !== -1) {
              const copy = prev.slice();
              copy[idx] = row;
              return copy;
            }
            return [row, ...prev];
          });

          markHighlight(row.id);
          void playNewOrderSound();
          const autoAceito = row.status === "preparando";
          toast.success(
            autoAceito
              ? "Novo pedido (aceito automaticamente)"
              : "Novo pedido recebido!",
            {
              description: row.cliente_nome
                ? `${row.cliente_nome} · R$ ${Number(row.total || 0)
                    .toFixed(2)
                    .replace(".", ",")}${autoAceito ? " · Em preparo" : ""}`
                : autoAceito
                  ? "Já entrou em preparo"
                  : undefined,
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
        },
        (payload) => {
          const row = payload.new as PedidoRow;
          if (!row?.id) return;

          setPedidosState((prev) => {
            const idx = prev.findIndex((p) => p.id === row.id);
            if (idx === -1) {
              // pedido ainda não estava na lista (ex.: filtro de página) → inclui
              return [row, ...prev];
            }
            // atualiza somente o item alterado
            if (prev[idx] === row) return prev;
            const copy = prev.slice();
            copy[idx] = { ...prev[idx], ...row };
            return copy;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "pedidos",
        },
        (payload) => {
          const old = payload.old as Partial<PedidoRow>;
          const id = old?.id;
          if (!id) return;

          setPedidosState((prev) => {
            const next = prev.filter((p) => p.id !== id);
            return next.length === prev.length ? prev : next;
          });
          clearHighlight(id);
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("live");
        } else if (
          subscribeStatus === "CHANNEL_ERROR" ||
          subscribeStatus === "TIMED_OUT"
        ) {
          setStatus("error");
        } else if (subscribeStatus === "CLOSED") {
          setStatus("error");
        } else {
          setStatus("connecting");
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
      // limpa timers de highlight
      highlightTimersRef.current.forEach((t) => clearTimeout(t));
      highlightTimersRef.current.clear();
    };
  }, [supabase, markHighlight, clearHighlight]);

  /** Atualização local otimista (ex.: mudança de status pelo admin) */
  const patchPedido = useCallback((id: string, patch: Partial<PedidoRow>) => {
    setPedidosState((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }, []);

  const replacePedido = useCallback((row: PedidoRow) => {
    setPedidosState((prev) => {
      const idx = prev.findIndex((p) => p.id === row.id);
      if (idx === -1) return [row, ...prev];
      const copy = prev.slice();
      copy[idx] = row;
      return copy;
    });
  }, []);

  const setPedidos = useCallback((next: PedidoRow[]) => {
    setPedidosState(next);
  }, []);

  return {
    pedidos,
    status,
    highlightedIds,
    patchPedido,
    replacePedido,
    setPedidos,
  };
}
