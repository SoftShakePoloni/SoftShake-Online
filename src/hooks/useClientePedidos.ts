"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function useClientePedidos(clienteId: string | null | undefined) {
  const [pedidos, setPedidos] = useState<ClientePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const flashTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const previousPedidos = useRef<ClientePedido[]>([]);

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
      const res = await fetch("/api/pedidos/listar", { cache: "no-store" });
      if (!res.ok) {
        setPedidos([]);
        setError("Não foi possível carregar seus pedidos");
        return;
      }
      const dados = (await res.json()) as { pedidos?: ClientePedido[] };
      const incoming = dados.pedidos || [];
      const previous = new Map(previousPedidos.current.map((pedido) => [pedido.id, pedido]));
      for (const pedido of incoming) {
        const old = previous.get(pedido.id);
        if (!old && previousPedidos.current.length > 0) {
          flash(pedido.id);
          toast.success("Novo pedido registrado!", { description: `#${pedido.id.slice(0, 8).toUpperCase()}` });
        } else if (old && old.status !== pedido.status) {
          flash(pedido.id);
          toast.message("Status atualizado", { description: `#${pedido.id.slice(0, 8).toUpperCase()} · ${pedido.status}` });
        }
      }
      previousPedidos.current = incoming;
      setPedidos(incoming);
    } catch {
      setError("Erro de conexão ao carregar pedidos");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, flash]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!clienteId) return;
    // Polling reduzido de 15 segundos para 30 segundos
    // Reduz requests de ~240 por hora para ~120 por hora
    const refresh = window.setInterval(() => void load(), 30_000);
    return () => {
      window.clearInterval(refresh);
      flashTimers.current.forEach((t) => clearTimeout(t));
      flashTimers.current.clear();
    };
  }, [clienteId, load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  return { pedidos, loading, error, flashIds, reload: load };
}
