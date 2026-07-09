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

function playNewOrderSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // som opcional
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
  const [pedidos, setPedidos] = useState<PedidoRow[]>(() => pedidosIniciais);
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

          setPedidos((prev) => {
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
          playNewOrderSound();
          toast.success("Novo pedido recebido!", {
            description: row.cliente_nome
              ? `${row.cliente_nome} · R$ ${Number(row.total || 0)
                  .toFixed(2)
                  .replace(".", ",")}`
              : undefined,
          });
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

          setPedidos((prev) => {
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

          setPedidos((prev) => {
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
    setPedidos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }, []);

  const replacePedido = useCallback((row: PedidoRow) => {
    setPedidos((prev) => {
      const idx = prev.findIndex((p) => p.id === row.id);
      if (idx === -1) return [row, ...prev];
      const copy = prev.slice();
      copy[idx] = row;
      return copy;
    });
  }, []);

  return {
    pedidos,
    status,
    highlightedIds,
    patchPedido,
    replacePedido,
  };
}
