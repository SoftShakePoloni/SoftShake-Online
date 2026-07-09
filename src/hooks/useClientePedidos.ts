"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  enrichPedidoItens,
  type OpcaoLookup,
  type GrupoLookup,
} from "@/lib/utils/pedido";
import { toast } from "sonner";

export type ClientePedidoItem = {
  uid?: string;
  qty: number;
  produto: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  total: number;
  observacoes?: string;
  adicionais?: Array<{
    name: string;
    price: number;
    groupName?: string;
  }>;
  selections?: Record<string, string[]> | Array<{ name: string; price: number }>;
};

export type ClientePedido = {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  tipo_entrega: string;
  endereco_completo: string | Record<string, unknown> | null;
  meio_pagamento: string;
  troco_para: string | number | null;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  itens: ClientePedidoItem[];
  status: string;
  created_at: string;
  updated_at?: string;
};

type Catalogo = {
  opcoes: OpcaoLookup[];
  grupos: GrupoLookup[];
};

type PedidoRowRaw = Record<string, unknown> & {
  id: string;
  subtotal?: number | string;
  taxa_entrega?: number | string;
  total?: number | string;
  itens?: unknown;
  status?: string;
  created_at?: string;
};

function enrich(rows: PedidoRowRaw[], catalogo: Catalogo | null): ClientePedido[] {
  return (rows || []).map((p) => {
    const itensRaw = Array.isArray(p.itens) ? p.itens : [];
    const itens = catalogo
      ? (enrichPedidoItens(
          itensRaw,
          catalogo.opcoes,
          catalogo.grupos
        ) as unknown as ClientePedidoItem[])
      : (itensRaw as ClientePedidoItem[]);

    return {
      ...(p as unknown as ClientePedido),
      id: String(p.id),
      subtotal: Number(p.subtotal || 0),
      taxa_entrega: Number(p.taxa_entrega || 0),
      total: Number(p.total || 0),
      itens,
      status: String(p.status || "pendente"),
      created_at: String(p.created_at || new Date().toISOString()),
    };
  });
}

export function useClientePedidos(clienteId: string | null | undefined) {
  const [pedidos, setPedidos] = useState<ClientePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const catalogoRef = useRef<Catalogo | null>(null);
  const flashTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const flash = useCallback((id: string) => {
    setFlashIds((prev) => new Set(prev).add(id));
    const prevT = flashTimers.current.get(id);
    if (prevT) clearTimeout(prevT);
    const t = setTimeout(() => {
      setFlashIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      flashTimers.current.delete(id);
    }, 2500);
    flashTimers.current.set(id, t);
  }, []);

  const load = useCallback(async () => {
    if (!clienteId) {
      setPedidos([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await fetch("/api/pedidos/listar");
      if (!res.ok) {
        setPedidos([]);
        setError("Não foi possível carregar seus pedidos");
        return;
      }
      const dados = (await res.json()) as { pedidos?: PedidoRowRaw[] };
      setPedidos(enrich(dados.pedidos || [], catalogoRef.current));
    } catch {
      setError("Erro de conexão ao carregar pedidos");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const [{ data: opcoes }, { data: grupos }] = await Promise.all([
        supabase
          .from("opcoes")
          .select(
            "id, nome, preco_adicional, grupo_id, grupo:grupos_opcoes(id, nome)"
          ),
        supabase.from("grupos_opcoes").select("id, nome"),
      ]);
      if (cancelled) return;
      catalogoRef.current = {
        opcoes: (opcoes || []) as OpcaoLookup[],
        grupos: (grupos || []) as GrupoLookup[],
      };
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!clienteId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`cliente-pedidos-${clienteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `cliente_id=eq.${clienteId}`,
        },
        (payload: RealtimePostgresChangesPayload<PedidoRowRaw>) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as PedidoRowRaw;
            setPedidos((prev) => {
              if (prev.some((p) => p.id === row.id)) return prev;
              const [mapped] = enrich([row], catalogoRef.current);
              return [mapped, ...prev];
            });
            flash(row.id);
            toast.success("Novo pedido registrado!", {
              description: `#${String(row.id).slice(0, 8).toUpperCase()}`,
            });
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as PedidoRowRaw;
            setPedidos((prev) => {
              const idx = prev.findIndex((p) => p.id === row.id);
              const [mapped] = enrich([row], catalogoRef.current);
              if (idx === -1) return [mapped, ...prev];
              const copy = prev.slice();
              const oldStatus = copy[idx].status;
              copy[idx] = mapped;
              if (oldStatus !== mapped.status) {
                flash(mapped.id);
                toast.message("Status atualizado", {
                  description: `#${mapped.id.slice(0, 8).toUpperCase()} · ${mapped.status}`,
                });
              }
              return copy;
            });
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<PedidoRowRaw>)?.id;
            if (!id) return;
            setPedidos((prev) => prev.filter((p) => p.id !== id));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      flashTimers.current.forEach((t) => clearTimeout(t));
      flashTimers.current.clear();
    };
  }, [clienteId, flash]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  return { pedidos, loading, error, flashIds, reload: load };
}
