"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
import { PedidosToolbar } from "./PedidosToolbar";
import { PedidoKanbanColumn } from "./PedidoKanbanColumn";
import { PedidoDetailPanel } from "./PedidoDetailPanel";
import { OrdersEmptyDetail } from "./OrdersEmptyDetail";
import { OrderPrint, type OrderPrintTipo } from "./OrderPrint";
import { OrdersSkeleton } from "./OrdersSkeleton";
import {
  KANBAN_COLUMNS,
  DEFAULT_FILTERS,
  filterPedidos,
  groupPedidosByColumn,
  resolveDropStatus,
  getPedidoColumnId,
  type PedidosFilters,
  type KanbanColumnId,
} from "./kanban-columns";
import { shortOrderId } from "./order-status";

export const SOUND_KEY = "softshake-orders-sound";

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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PedidosFilters>(DEFAULT_FILTERS);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [printPedido, setPrintPedido] = useState<{
    pedido: Pedido;
    tipo: OrderPrintTipo;
  } | null>(null);

  const {
    pedidos: pedidosRows,
    highlightedIds,
    patchPedido,
    replacePedido,
    setPedidos,
  } = usePedidosRealtime(pedidosIniciais);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Som
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

  useEffect(() => {
    const unlock = () => {
      void unlockPedidosAudio();
    };
    window.addEventListener("pointerdown", unlock, {
      once: true,
      passive: true,
    });
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
    if (value) {
      const unlocked = await unlockPedidosAudio();
      if (unlocked) {
        void playNewOrderSound();
        toast.success("Som ativado");
      } else {
        toast.error("Não foi possível ativar o som");
      }
    }
  }, []);

  // Catálogo
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

  useEffect(() => {
    let cancelled = false;
    void getStoreSettings()
      .then((s) => {
        if (!cancelled) setAutoAccept(Boolean(s.auto_accept_orders));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pedidos: Pedido[] = useMemo(
    () => pedidosRows.map((p) => mapPedido(p, opcoes, grupos)),
    [pedidosRows, opcoes, grupos]
  );

  const filtered = useMemo(
    () => filterPedidos(pedidos, search, filters),
    [pedidos, search, filters]
  );

  const byColumn = useMemo(
    () => groupPedidosByColumn(filtered),
    [filtered]
  );

  const selectedPedido = useMemo(
    () => pedidos.find((p) => p.id === selectedId) ?? null,
    [pedidos, selectedId]
  );

  const activeDragPedido = useMemo(
    () => (activeDragId ? pedidos.find((p) => p.id === activeDragId) : null),
    [activeDragId, pedidos]
  );

  useEffect(() => {
    if (!selectedId) return;
    if (!pedidosRows.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [pedidosRows, selectedId]);

  // Impressão avulsa
  useEffect(() => {
    if (!printPedido) return;
    let finished = false;
    const run = () => window.print();
    const done = () => {
      if (finished) return;
      finished = true;
      setPrintPedido(null);
    };
    const t1 = window.setTimeout(run, 250);
    const t2 = window.setTimeout(done, 8000);
    window.addEventListener("afterprint", done);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("afterprint", done);
    };
  }, [printPedido]);

  const handleStatusChange = useCallback(
    async (pedidoId: string, newStatus: Pedido["status"]) => {
      const previous = pedidosRows.find((p) => p.id === pedidoId);
      setStatusBusy(true);
      patchPedido(pedidoId, {
        status: newStatus,
        updated_at: new Date().toISOString(),
      });
      try {
        const updated = await updatePedidoStatus(
          pedidoId,
          newStatus as PedidoStatusUpdate
        );
        replacePedido(updated as PedidoRow);
        toast.success("Alterações salvas.");
        return true;
      } catch (error) {
        console.error(error);
        if (previous) replacePedido(previous);
        toast.error("Erro ao atualizar status");
        return false;
      } finally {
        setStatusBusy(false);
      }
    },
    [pedidosRows, patchPedido, replacePedido]
  );

  const handleDrawerStatusChange = useCallback(
    async (newStatus: Pedido["status"]) => {
      if (!selectedId) return false;
      return handleStatusChange(selectedId, newStatus);
    },
    [selectedId, handleStatusChange]
  );

  const handleOpen = useCallback((pedido: Pedido) => {
    setSelectedId(pedido.id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleCardAction = useCallback(
    (
      pedido: Pedido,
      action:
        | { type: "status"; status: Pedido["status"]; printAfter?: boolean }
        | { type: "print" }
        | { type: "details" }
    ) => {
      if (action.type === "details") {
        handleOpen(pedido);
        return;
      }
      if (action.type === "print") {
        setPrintPedido({ pedido, tipo: "completo" });
        return;
      }
      void (async () => {
        const ok = await handleStatusChange(pedido.id, action.status);
        if (ok && action.printAfter) {
          const updated = { ...pedido, status: action.status };
          setPrintPedido({ pedido: updated, tipo: "completo" });
        }
      })();
    },
    [handleOpen, handleStatusChange]
  );

  const handleAutoAcceptChange = useCallback(
    async (value: boolean) => {
      setAutoAcceptLoading(true);
      const previous = autoAccept;
      setAutoAccept(value);
      try {
        await setAutoAcceptOrders(value);
        toast.success(
          value ? "Aceite automático ativado" : "Aceite automático desativado"
        );
      } catch {
        setAutoAccept(previous);
        toast.error("Não foi possível salvar");
      } finally {
        setAutoAcceptLoading(false);
      }
    },
    [autoAccept]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await listPedidosAdmin(150);
      setPedidos(data as PedidoRow[]);
      toast.success("Lista atualizada");
    } catch {
      toast.error("Falha ao atualizar");
    } finally {
      setRefreshing(false);
    }
  }, [setPedidos]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const pedidoId = String(active.id);
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;

    let targetColumn: KanbanColumnId | null = null;
    const overId = String(over.id);

    if (overId.startsWith("col-")) {
      targetColumn = overId.replace("col-", "") as KanbanColumnId;
    } else {
      // Soltou sobre outro card
      const overPedido = pedidos.find((p) => p.id === overId);
      if (overPedido) {
        targetColumn = getPedidoColumnId(overPedido);
      }
    }

    if (!targetColumn) return;

    const currentCol = getPedidoColumnId(pedido);
    if (currentCol === targetColumn) return;

    const newStatus = resolveDropStatus(targetColumn, pedido);
    if (newStatus === pedido.status && currentCol !== targetColumn) {
      // Mesmo status no banco (ex.: preparando entre Produção e Prontos)
      // Para pickup: Produção e Prontos usam preparando — se ambos são preparando,
      // o agrupamento já decide pela tipo. Drag delivery → Prontos: manter preparando.
      // Se for delivery em Prontos, opcionalmente ir para saiu_entrega
      if (
        targetColumn === "prontos" &&
        (pedido.tipo_entrega === "delivery" ||
          pedido.tipo_entrega === "entrega")
      ) {
        await handleStatusChange(pedidoId, "saiu_entrega");
        return;
      }
      if (
        targetColumn === "em_producao" &&
        pedido.status === "preparando"
      ) {
        return;
      }
    }

    if (newStatus !== pedido.status) {
      await handleStatusChange(pedidoId, newStatus);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[type="search"]'
        );
        input?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!catalogReady && pedidosIniciais.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <OrdersSkeleton />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#F9FAFB]">
      <PedidosToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing}
        soundEnabled={soundEnabled}
        onSoundChange={(v) => void handleSoundChange(v)}
        autoAccept={autoAccept}
        autoAcceptLoading={autoAcceptLoading}
        onAutoAcceptChange={(v) => void handleAutoAcceptChange(v)}
        totalCount={filtered.length}
      />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Esquerda — lista vertical */}
        <aside
          className={
            selectedPedido
              ? "hidden lg:flex lg:flex-col lg:w-[380px] xl:w-[420px] shrink-0 h-full border-r border-[#E5E7EB] bg-[#F9FAFB]"
              : "flex flex-col w-full lg:w-[380px] xl:w-[420px] shrink-0 h-full border-r border-[#E5E7EB] bg-[#F9FAFB]"
          }
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={(e) => void handleDragEnd(e)}
            >
              {KANBAN_COLUMNS.map((col) => (
                <PedidoKanbanColumn
                  key={col.id}
                  column={col}
                  pedidos={byColumn[col.id]}
                  selectedId={selectedId}
                  highlightedIds={highlightedIds}
                  onOpen={handleOpen}
                  onAction={handleCardAction}
                  busy={statusBusy}
                  vertical
                />
              ))}

              <DragOverlay>
                {activeDragPedido ? (
                  <div className="w-[340px] opacity-95 shadow-md rounded-md border border-[#4C258C] bg-white px-3 py-2">
                    <p className="text-[15px] font-semibold">
                      #{shortOrderId(activeDragPedido.id)}
                    </p>
                    <p className="text-[13px] text-[#6B7280] truncate">
                      {activeDragPedido.cliente_nome}
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {filtered.length === 0 && (
              <p className="text-center text-[13px] text-[#9CA3AF] py-10">
                Nenhum pedido encontrado.
              </p>
            )}
          </div>
        </aside>

        {/* Direita — detalhes */}
        <div
          className={
            selectedPedido
              ? "flex flex-1 min-w-0 h-full"
              : "hidden lg:flex flex-1 min-w-0 h-full"
          }
        >
          {selectedPedido ? (
            <PedidoDetailPanel
              pedido={selectedPedido}
              onStatusChange={handleDrawerStatusChange}
              onClose={handleClose}
              busy={statusBusy}
            />
          ) : (
            <OrdersEmptyDetail />
          )}
        </div>
      </div>

      {printPedido && (
        <OrderPrint pedido={printPedido.pedido} tipo={printPedido.tipo} />
      )}
    </div>
  );
}
