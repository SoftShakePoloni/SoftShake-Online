"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Pedido } from "@/types/pedido";
import { cn } from "@/lib/utils";
import { PedidoKanbanCard } from "./PedidoKanbanCard";
import type { KanbanColumnDef } from "./kanban-columns";

type CardAction = Parameters<
  React.ComponentProps<typeof PedidoKanbanCard>["onAction"]
>[1];

interface PedidoKanbanColumnProps {
  column: KanbanColumnDef;
  pedidos: Pedido[];
  selectedId?: string | null;
  highlightedIds?: Set<string>;
  onOpen: (pedido: Pedido) => void;
  onAction: (pedido: Pedido, action: CardAction) => void;
  busy?: boolean;
  /** Layout vertical (lista empilhada) vs coluna Kanban */
  vertical?: boolean;
}

export function PedidoKanbanColumn({
  column,
  pedidos,
  selectedId,
  highlightedIds,
  onOpen,
  onAction,
  busy,
  vertical = true,
}: PedidoKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { columnId: column.id },
  });

  if (vertical) {
    return (
      <section
        className={cn(
          "rounded-md border border-[#E5E7EB] bg-white overflow-hidden",
          isOver && "ring-1 ring-[#4C258C]/40"
        )}
      >
        <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFAFA]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn("w-1.5 h-1.5 rounded-full shrink-0", column.accent)}
            />
            <h3 className="text-[13px] font-semibold text-[#111827]">
              {column.label}
            </h3>
          </div>
          <span className="text-[12px] font-semibold tabular-nums text-[#6B7280] bg-[#F3F4F6] min-w-[1.5rem] h-5 px-1.5 rounded flex items-center justify-center">
            {pedidos.length}
          </span>
        </header>

        <div ref={setNodeRef} className="p-2 space-y-1.5 min-h-[48px]">
          <SortableContext
            items={pedidos.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {pedidos.length === 0 ? (
              <p className="text-center text-[12px] text-[#9CA3AF] py-3">
                Nenhum pedido
              </p>
            ) : (
              pedidos.map((p) => (
                <PedidoKanbanCard
                  key={p.id}
                  pedido={p}
                  isSelected={selectedId === p.id}
                  isHighlighted={highlightedIds?.has(p.id)}
                  onOpen={onOpen}
                  onAction={onAction}
                  disabled={busy}
                  layout="row"
                />
              ))
            )}
          </SortableContext>
        </div>
      </section>
    );
  }

  // Fallback coluna (não usado no layout atual)
  return (
    <section
      className={cn(
        "flex flex-col min-w-0 h-full rounded-md border border-[#E5E7EB] bg-[#F3F4F6]/60",
        isOver && "ring-1 ring-[#4C258C]/40 bg-[#EEE8FA]/30"
      )}
    >
      <header className="shrink-0 flex items-center justify-between gap-2 px-2.5 py-2 border-b border-[#E5E7EB] bg-white rounded-t-md">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", column.accent)}
          />
          <h3 className="text-[13px] font-semibold text-[#111827] truncate">
            {column.label}
          </h3>
        </div>
        <span className="text-[12px] font-semibold tabular-nums text-[#6B7280] bg-[#F3F4F6] min-w-[1.5rem] h-5 px-1.5 rounded flex items-center justify-center">
          {pedidos.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-2 min-h-[120px]"
      >
        <SortableContext
          items={pedidos.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {pedidos.map((p) => (
            <PedidoKanbanCard
              key={p.id}
              pedido={p}
              isHighlighted={highlightedIds?.has(p.id)}
              onOpen={onOpen}
              onAction={onAction}
              disabled={busy}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
