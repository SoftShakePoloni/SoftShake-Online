"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProdutoRow } from "./ProdutoRow";
import { CatalogEmpty } from "./CatalogEmpty";
import type {
  CatalogCategoria,
  CatalogProduto,
  ProdutoSort,
  ProdutoStatusFilter,
} from "./types";
import { produtoStatus } from "./types";

const PAGE_SIZE = 50;

export function ProdutosArea({
  categorias,
  produtos,
  selectedCategoriaId,
  search,
  onReorder,
  onEdit,
  onDuplicate,
  onView,
  onDelete,
  onToggleDisponivel,
  onNovoProduto,
}: {
  categorias: CatalogCategoria[];
  produtos: CatalogProduto[];
  selectedCategoriaId: string | null;
  search: string;
  onReorder: (orderedIds: string[]) => void;
  onEdit: (p: CatalogProduto) => void;
  onDuplicate: (p: CatalogProduto) => void;
  onView: (p: CatalogProduto) => void;
  onDelete: (p: CatalogProduto) => void;
  onToggleDisponivel: (p: CatalogProduto) => void;
  onNovoProduto: () => void;
}) {
  const [statusFilter, setStatusFilter] =
    useState<ProdutoStatusFilter>("todos");
  const [sort, setSort] = useState<ProdutoSort>("ordem");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [dndReady, setDndReady] = useState(false);

  useEffect(() => {
    setDndReady(true);
  }, []);

  const categoriaNome = useMemo(() => {
    if (selectedCategoriaId == null) return "Todos os produtos";
    if (selectedCategoriaId === "__none__") return "Sem categoria";
    return (
      categorias.find((c) => String(c.id) === selectedCategoriaId)?.nome ||
      "Categoria"
    );
  }, [categorias, selectedCategoriaId]);

  const filtered = useMemo(() => {
    let list = produtos.slice();

    if (selectedCategoriaId == null) {
      // all
    } else if (selectedCategoriaId === "__none__") {
      list = list.filter((p) => p.categoria_id == null);
    } else {
      list = list.filter(
        (p) => String(p.categoria_id) === selectedCategoriaId
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hay = [
          p.nome,
          p.descricao || "",
          p.categoria?.nome || "",
          p.codigo || "",
          String(p.id),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (statusFilter !== "todos") {
      list = list.filter((p) => produtoStatus(p) === statusFilter);
    }

    switch (sort) {
      case "nome":
        list.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        break;
      case "preco_asc":
        list.sort((a, b) => Number(a.preco_base) - Number(b.preco_base));
        break;
      case "preco_desc":
        list.sort((a, b) => Number(b.preco_base) - Number(a.preco_base));
        break;
      case "recentes":
        list.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      default:
        list.sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));
    }

    return list;
  }, [produtos, selectedCategoriaId, search, statusFilter, sort]);

  const page = filtered.slice(0, visible);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const canReorder =
    sort === "ordem" &&
    !search.trim() &&
    statusFilter === "todos" &&
    selectedCategoriaId != null &&
    selectedCategoriaId !== "__none__";

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = page.map((p) => String(p.id));
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  const renderTable = (enableDnd: boolean) => (
    <table className="w-full text-left border-collapse min-w-[640px]">
      <thead className="sticky top-0 z-[1] bg-[#FAFAFA] border-b border-[#E5E7EB]">
        <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
          <th className="w-8 py-2 pl-2 font-medium" />
          <th className="py-2 pr-3 font-medium">Produto</th>
          <th className="py-2 pr-3 font-medium hidden md:table-cell">
            Categoria
          </th>
          <th className="py-2 pr-3 font-medium">Preço</th>
          <th className="py-2 pr-3 font-medium">Status</th>
          <th className="py-2 pr-3 font-medium hidden sm:table-cell">
            Ativo
          </th>
          <th className="py-2 pr-3 font-medium hidden lg:table-cell">
            Atualização
          </th>
          <th className="py-2 pr-3 font-medium text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {page.map((p) => (
          <ProdutoRow
            key={p.id}
            produto={p}
            enableDnd={enableDnd}
            onEdit={() => onEdit(p)}
            onDuplicate={() => onDuplicate(p)}
            onView={() => onView(p)}
            onDelete={() => onDelete(p)}
            onToggleDisponivel={() => onToggleDisponivel(p)}
          />
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#F9FAFB]">
      <div className="shrink-0 px-3 sm:px-4 py-2 border-b border-[#E5E7EB] bg-white flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#111827]">
            {categoriaNome}
          </p>
          <p className="text-[12px] text-[#6B7280]">
            <span className="font-semibold tabular-nums text-[#111827]">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "produto" : "produtos"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ProdutoStatusFilter);
              setVisible(PAGE_SIZE);
            }}
          >
            <SelectTrigger className="h-8 w-[128px] rounded-md border-[#E5E7EB] text-[12px]">
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-[12px]">
                Todos
              </SelectItem>
              <SelectItem value="ativo" className="text-[12px]">
                Disponíveis
              </SelectItem>
              <SelectItem value="inativo" className="text-[12px]">
                Indisponíveis
              </SelectItem>
              <SelectItem value="promocao" className="text-[12px]">
                Promoção
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as ProdutoSort);
              setVisible(PAGE_SIZE);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] rounded-md border-[#E5E7EB] text-[12px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ordem" className="text-[12px]">
                Ordem manual
              </SelectItem>
              <SelectItem value="nome" className="text-[12px]">
                Nome
              </SelectItem>
              <SelectItem value="preco_asc" className="text-[12px]">
                Menor preço
              </SelectItem>
              <SelectItem value="preco_desc" className="text-[12px]">
                Maior preço
              </SelectItem>
              <SelectItem value="recentes" className="text-[12px]">
                Mais recentes
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-6">
            <CatalogEmpty
              kind={search.trim() ? "busca" : "produtos"}
              actionLabel={search.trim() ? undefined : "Novo produto"}
              onAction={search.trim() ? undefined : onNovoProduto}
            />
          </div>
        ) : dndReady && canReorder ? (
          /* DndContext FORA da <table> — ele injeta <div>s de acessibilidade */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={page.map((p) => String(p.id))}
              strategy={verticalListSortingStrategy}
            >
              {renderTable(true)}
            </SortableContext>
          </DndContext>
        ) : (
          renderTable(false)
        )}

        {visible < filtered.length && (
          <div className="flex justify-center py-4 border-t border-[#E5E7EB] bg-white">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="text-[13px] font-medium text-blue-600 hover:underline"
            >
              Carregar mais ({filtered.length - visible})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
