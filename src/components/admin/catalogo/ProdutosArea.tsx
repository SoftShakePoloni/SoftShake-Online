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
import { Filter, ArrowUpDown } from "lucide-react";
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

const PAGE_SIZE = 40;

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
  // dnd-kit gera IDs diferentes no SSR → só monta DnD no cliente
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
        list.sort(
          (a, b) => Number(a.ordem || 0) - Number(b.ordem || 0)
        );
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

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#F7F8FC]">
      <div className="px-4 sm:px-6 py-4 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827] tracking-tight">
              {categoriaNome}
            </h2>
            <p className="text-sm text-[#6B7280]">
              <span className="font-semibold text-[#4C258C] tabular-nums">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "produto" : "produtos"}
              {search.trim() ? " encontrados" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <Filter className="w-3.5 h-3.5" />
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as ProdutoStatusFilter);
                  setVisible(PAGE_SIZE);
                }}
              >
                <SelectTrigger className="h-8 w-[130px] rounded-lg text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                  <SelectItem value="promocao">Promoção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v as ProdutoSort);
                  setVisible(PAGE_SIZE);
                }}
              >
                <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordem">Ordem manual</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="preco_asc">Menor preço</SelectItem>
                  <SelectItem value="preco_desc">Maior preço</SelectItem>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {filtered.length === 0 ? (
          <CatalogEmpty
            kind={search.trim() ? "busca" : "produtos"}
            actionLabel={search.trim() ? undefined : "Novo produto"}
            onAction={search.trim() ? undefined : onNovoProduto}
          />
        ) : dndReady ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={page.map((p) => String(p.id))}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5 max-w-5xl">
                {page.map((p) => (
                  <ProdutoRow
                    key={p.id}
                    produto={p}
                    enableDnd
                    onEdit={() => onEdit(p)}
                    onDuplicate={() => onDuplicate(p)}
                    onView={() => onView(p)}
                    onDelete={() => onDelete(p)}
                    onToggleDisponivel={() => onToggleDisponivel(p)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-1.5 max-w-5xl">
            {page.map((p) => (
              <ProdutoRow
                key={p.id}
                produto={p}
                enableDnd={false}
                onEdit={() => onEdit(p)}
                onDuplicate={() => onDuplicate(p)}
                onView={() => onView(p)}
                onDelete={() => onDelete(p)}
                onToggleDisponivel={() => onToggleDisponivel(p)}
              />
            ))}
          </div>
        )}

        {visible < filtered.length && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="text-sm font-medium text-[#4C258C] hover:underline px-4 py-2"
            >
              Carregar mais ({filtered.length - visible} restantes)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
