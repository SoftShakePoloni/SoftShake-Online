"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Pedido } from "@/types/pedido";
import { OrderList } from "./OrderList";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { OrderSidePanel } from "./OrderSidePanel";
import { EmptyState } from "./EmptyState";
import { formatEndereco } from "@/lib/utils/formatters";
import { createClient } from "@/lib/supabase/client";
import {
  enrichPedidoItens,
  type OpcaoLookup,
  type GrupoLookup,
} from "@/lib/utils/pedido";
import {
  updatePedidoStatus,
  type PedidoStatusUpdate,
} from "@/actions/admin/pedidos";
import {
  usePedidosRealtime,
  type PedidoRow,
} from "@/hooks/usePedidosRealtime";
import { toast } from "sonner";

interface PedidosManagerProps {
  pedidosIniciais: PedidoRow[];
}

function mapPedido(
  p: PedidoRow,
  opcoes: OpcaoLookup[],
  grupos: GrupoLookup[]
): Pedido {
  const itensEnriquecidos = enrichPedidoItens(
    (p.itens as any[]) || [],
    opcoes,
    grupos
  );

  return {
    id: p.id,
    cliente_nome: p.cliente_nome || "Cliente",
    cliente_telefone: p.cliente_telefone ?? undefined,
    tipo_entrega: (p.tipo_entrega as Pedido["tipo_entrega"]) || "delivery",
    endereco_completo:
      formatEndereco(p.endereco_completo as any) || undefined,
    meio_pagamento: p.meio_pagamento || "Não informado",
    troco_para: (() => {
      if (p.troco_para == null || p.troco_para === "") return undefined;
      const n = Number(p.troco_para);
      return Number.isFinite(n) ? n : undefined;
    })(),
    subtotal: Number(p.subtotal || 0),
    taxa_entrega: Number(p.taxa_entrega || 0),
    total: Number(p.total || 0),
    itens: itensEnriquecidos,
    status: (p.status as Pedido["status"]) || "pendente",
    observacoes: p.observacoes ?? undefined,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || p.created_at || new Date().toISOString(),
  };
}

export function PedidosManager({ pedidosIniciais }: PedidosManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [opcoes, setOpcoes] = useState<OpcaoLookup[]>([]);
  const [grupos, setGrupos] = useState<GrupoLookup[]>([]);

  const {
    pedidos: pedidosRows,
    status: realtimeStatus,
    highlightedIds,
    patchPedido,
    replacePedido,
  } = usePedidosRealtime(pedidosIniciais);

  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Catálogo de opções — 1x no mount (só para resolver nomes de adicionais)
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function loadCatalogo() {
      const [{ data: ops }, { data: grps }] = await Promise.all([
        supabase
          .from("opcoes")
          .select(
            "id, nome, preco_adicional, grupo_id, grupo:grupos_opcoes(id, nome)"
          ),
        supabase.from("grupos_opcoes").select("id, nome"),
      ]);
      if (cancelled) return;
      setOpcoes((ops || []) as OpcaoLookup[]);
      setGrupos((grps || []) as GrupoLookup[]);
    }

    void loadCatalogo();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mapeia rows → UI; só recalcula quando rows/catálogo mudam
  const pedidos: Pedido[] = useMemo(
    () => pedidosRows.map((p) => mapPedido(p, opcoes, grupos)),
    [pedidosRows, opcoes, grupos]
  );

  const selectedPedido = useMemo(
    () => pedidos.find((p) => p.id === selectedId) ?? null,
    [pedidos, selectedId]
  );

  // Se o pedido selecionado for deletado via Realtime, limpa seleção
  useEffect(() => {
    if (!selectedId) return;
    if (!pedidosRows.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [pedidosRows, selectedId]);

  const handleSelect = useCallback((pedido: Pedido) => {
    setIsTransitioning(true);
    window.setTimeout(() => {
      setSelectedId(pedido.id);
      setIsTransitioning(false);
    }, 120);
  }, []);

  const handleStatusChange = useCallback(
    async (newStatus: Pedido["status"]) => {
      if (!selectedId) return;

      const previous = pedidosRows.find((p) => p.id === selectedId);

      // Otimista local (Realtime confirmará o UPDATE para todos os admins)
      patchPedido(selectedId, {
        status: newStatus,
        updated_at: new Date().toISOString(),
      });

      try {
        const updated = await updatePedidoStatus(
          selectedId,
          newStatus as PedidoStatusUpdate
        );
        replacePedido(updated as PedidoRow);
        toast.success("Status atualizado");
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        if (previous) replacePedido(previous);
        toast.error("Erro ao atualizar status");
      }
    },
    [selectedId, pedidosRows, patchPedido, replacePedido]
  );

  return (
    <div className="h-screen flex overflow-hidden">
      <OrderList
        pedidos={pedidos}
        selectedId={selectedPedido?.id}
        onSelect={handleSelect}
        realtimeStatus={realtimeStatus}
        highlightedIds={highlightedIds}
      />

      <div
        className={`flex-1 transition-opacity duration-200 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {selectedPedido ? (
          <OrderDetailPanel
            pedido={selectedPedido}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {selectedPedido && (
        <div
          className={`transition-all duration-200 ${
            isTransitioning
              ? "opacity-0 translate-x-4"
              : "opacity-100 translate-x-0"
          }`}
        >
          <OrderSidePanel
            pedido={selectedPedido}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  );
}
