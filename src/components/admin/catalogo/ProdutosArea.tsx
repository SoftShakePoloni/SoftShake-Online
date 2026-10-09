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
    <table className="w-full min-w-[720px] border-collapse text-left">
      <thead className="sticky top-0 z-[1] border-b border-[#EEEAF1] bg-[#FBFAFC]">
        <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#89838F]">
          <th className="w-10 py-3 pl-3 font-semibold" />
          <th className="py-3 pr-4 font-semibold">Produto</th>
          <th className="hidden py-3 pr-4 font-semibold md:table-cell">
            Categoria
          </th>
          <th className="py-3 pr-4 font-semibold">Preço</th>
          <th className="py-3 pr-4 font-semibold">Status</th>
          <th className="hidden py-3 pr-4 font-semibold sm:table-cell">
            Ativo
          </th>
          <th className="hidden py-3 pr-4 font-semibold lg:table-cell">
            Atualização
          </th>
          <th className="py-3 pr-4 text-right font-semibold">Ações</th>
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
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E7E3EA] bg-white shadow-sm">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EEEAF1] bg-white px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#25212A]">
            {categoriaNome}
          </p>
          <p className="mt-0.5 text-[12px] text-[#817B87]">
            <span className="font-semibold tabular-nums text-[#514B59]">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "produto" : "produtos"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ProdutoStatusFilter);
              setVisible(PAGE_SIZE);
            }}
          >
            <SelectTrigger className="h-9 w-[136px] rounded-lg border-[#E4E1E8] bg-white text-[12px] text-[#514B59] shadow-none">
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
            <SelectTrigger className="h-9 w-[144px] rounded-lg border-[#E4E1E8] bg-white text-[12px] text-[#514B59] shadow-none">
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

      <div className="min-h-0 flex-1 overflow-auto">
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
          <div className="flex justify-center border-t border-[#EEEAF1] bg-white py-4">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#4C258C] transition-colors hover:bg-[#F5F2F8]"
            >
              Carregar mais ({filtered.length - visible})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
