"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Pedido } from "@/types/pedido";
import { formatEndereco } from "@/lib/utils/formatters";
import { createClient } from "@/lib/supabase/client";
import {
  enrichPedidoItens,
  type OpcaoLookup,
  type GrupoLookup,
} from "@/lib/utils/pedido";
import {
  updatePedidoStatus,
  listPedidosAdmin,
  type PedidoStatusUpdate,
} from "@/actions/admin/pedidos";
import {
  getStoreSettings,
  setAutoAcceptOrders,
} from "@/actions/admin/store-settings";
import {
  usePedidosRealtime,
  type PedidoRow,
  setPedidosSoundEnabled,
  unlockPedidosAudio,
  playNewOrderSound,
} from "@/hooks/usePedidosRealtime";
import { toast } from "sonner";
import { OrdersPanel, SOUND_KEY } from "./OrdersPanel";
import { OrderDetailView } from "./OrderDetailView";
import { OrdersEmptyDetail } from "./OrdersEmptyDetail";
import { OrdersSkeleton } from "./OrdersSkeleton";

interface PedidosManagerProps {
  pedidosIniciais: PedidoRow[];
  autoAcceptInicial?: boolean;
}

function mapPedido(
  p: PedidoRow,
  opcoes: OpcaoLookup[],
  grupos: GrupoLookup[]
): Pedido {
  const itensEnriquecidos = enrichPedidoItens(
    Array.isArray(p.itens) ? p.itens : [],
    opcoes,
    grupos
  ) as unknown as Pedido["itens"];

  const rawStatus = (p.status as Pedido["status"]) || "pendente";

  return {
    id: p.id,
    cliente_nome: p.cliente_nome || "Cliente",
    cliente_telefone: p.cliente_telefone ?? undefined,
    tipo_entrega: (p.tipo_entrega as Pedido["tipo_entrega"]) || "delivery",
    endereco_completo:
      formatEndereco(
        p.endereco_completo as
          | string
          | import("@/types/pedido").EnderecoObject
          | null
          | undefined
      ) || undefined,
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
    status: rawStatus,
    observacoes: p.observacoes ?? undefined,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || p.created_at || new Date().toISOString(),
  };
}

export function PedidosManager({
  pedidosIniciais,
  autoAcceptInicial = false,
}: PedidosManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opcoes, setOpcoes] = useState<OpcaoLookup[]>([]);
  const [grupos, setGrupos] = useState<GrupoLookup[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [autoAccept, setAutoAccept] = useState(autoAcceptInicial);
  const [autoAcceptLoading, setAutoAcceptLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    pedidos: pedidosRows,
    status: realtimeStatus,
    highlightedIds,
    patchPedido,
    replacePedido,
    setPedidos,
  } = usePedidosRealtime(pedidosIniciais);

  // Preferência de som
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SOUND_KEY);
      if (stored != null) {
        const enabled = stored === "1" || stored === "true";
        setSoundEnabled(enabled);
        setPedidosSoundEnabled(enabled);
      } else {
        setPedidosSoundEnabled(true);
      }
    } catch {
      setPedidosSoundEnabled(true);
    }
  }, []);

  // Navegadores bloqueiam áudio até o admin interagir com a página
  useEffect(() => {
    const unlock = () => {
      void unlockPedidosAudio();
    };
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const handleSoundChange = useCallback(async (value: boolean) => {
    setSoundEnabled(value);
    setPedidosSoundEnabled(value);
    try {
      localStorage.setItem(SOUND_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }

    // Clique do admin = gesto do usuário: libera o áudio no browser
    if (value) {
      const unlocked = await unlockPedidosAudio();
      if (unlocked) {
        // Preview curto para confirmar que o som funciona
        void playNewOrderSound();
        toast.success("Som de novos pedidos ativado");
      } else {
        toast.error("Não foi possível ativar o som", {
          description: "Clique novamente no autofalante ou permita áudio no navegador",
        });
      }
    } else {
      toast.message("Som de novos pedidos desativado");
    }
  }, []);

  // Catálogo de opções (adicionais)
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function loadCatalogo() {
      try {
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
      } finally {
        if (!cancelled) setCatalogReady(true);
      }
    }

    void loadCatalogo();
    return () => {
      cancelled = true;
    };
  }, []);

  // Garante auto_accept sincronizado (caso SSR falhe ou multi-admin)
  useEffect(() => {
    let cancelled = false;
    void getStoreSettings()
      .then((s) => {
        if (!cancelled) setAutoAccept(Boolean(s.auto_accept_orders));
      })
      .catch(() => {
        // migration ainda não aplicada
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pedidos: Pedido[] = useMemo(
    () => pedidosRows.map((p) => mapPedido(p, opcoes, grupos)),
    [pedidosRows, opcoes, grupos]
  );

  const selectedPedido = useMemo(
    () => pedidos.find((p) => p.id === selectedId) ?? null,
    [pedidos, selectedId]
  );

  // Se pedido sumir, limpa seleção
  useEffect(() => {
    if (!selectedId) return;
    if (!pedidosRows.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [pedidosRows, selectedId]);

  const handleSelect = useCallback((pedido: Pedido) => {
    setSelectedId(pedido.id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleStatusChange = useCallback(
    async (newStatus: Pedido["status"]) => {
      if (!selectedId) return false;

      const previous = pedidosRows.find((p) => p.id === selectedId);
      setStatusBusy(true);

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
        toast.success("Status atualizado", {
          description: `Pedido atualizado com sucesso`,
        });
        return true;
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        if (previous) replacePedido(previous);
        toast.error("Erro ao atualizar status");
        return false;
      } finally {
        setStatusBusy(false);
      }
    },
    [selectedId, pedidosRows, patchPedido, replacePedido]
  );

  const handleAutoAcceptChange = useCallback(async (value: boolean) => {
    setAutoAcceptLoading(true);
    const previous = autoAccept;
    setAutoAccept(value);
    try {
      await setAutoAcceptOrders(value);
      toast.success(
        value
          ? "Aceite automático ativado"
          : "Aceite automático desativado",
        {
          description: value
            ? "Novos pedidos já chegam em Em preparo (sem passo manual)"
            : "Novos pedidos ficam em Novos até você aceitar",
        }
      );
    } catch (error) {
      console.error(error);
      setAutoAccept(previous);
      toast.error("Não foi possível salvar a configuração", {
        description:
          "Verifique se a coluna aceitar_pedidos_automaticamente existe em configuracoes_loja",
      });
    } finally {
      setAutoAcceptLoading(false);
    }
  }, [autoAccept]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await listPedidosAdmin(150);
      setPedidos(data as PedidoRow[]);
      toast.success("Lista atualizada");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao atualizar pedidos");
    } finally {
      setRefreshing(false);
    }
  }, [setPedidos]);

  // Mobile: esconde lista quando tem seleção? For now side-by-side with min widths

  if (!catalogReady && pedidosIniciais.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)]">
        <OrdersSkeleton />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden bg-[#F7F8FC]">
      {/* Lista: oculta no mobile quando há pedido selecionado */}
      <div
        className={
          selectedPedido
            ? "hidden lg:flex lg:h-full"
            : "flex h-full w-full lg:w-auto"
        }
      >
        <OrdersPanel
          pedidos={pedidos}
          selectedId={selectedId}
          onSelect={handleSelect}
          realtimeStatus={realtimeStatus}
          highlightedIds={highlightedIds}
          autoAccept={autoAccept}
          autoAcceptLoading={autoAcceptLoading}
          onAutoAcceptChange={handleAutoAcceptChange}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          soundEnabled={soundEnabled}
          onSoundChange={handleSoundChange}
        />
      </div>

      {/* Detalhe: full width no mobile quando selecionado */}
      <div
        className={
          selectedPedido
            ? "flex flex-1 min-w-0 h-full"
            : "hidden lg:flex flex-1 min-w-0 h-full"
        }
      >
        {selectedPedido ? (
          <OrderDetailView
            pedido={selectedPedido}
            onStatusChange={handleStatusChange}
            onClose={handleClose}
            busy={statusBusy}
          />
        ) : (
          <OrdersEmptyDetail />
        )}
      </div>
    </div>
  );
}
