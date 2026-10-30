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
import { Search } from "lucide-react";
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
  onSearchChange,
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
  onSearchChange: (value: string) => void;
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
      list = list.filter((p) => String(p.categoria_id) === selectedCategoriaId);
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
    }),
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
    <table className="catalog-product-table">
      <caption className="sr-only">{categoriaNome}</caption>
      <thead>
        <tr>
          <th aria-label="Reordenação" />
          <th scope="col">Produto</th>
          <th scope="col">Categoria</th>
          <th scope="col">Preço</th>
          <th scope="col">Disponibilidade</th>
          <th scope="col">
            <span className="sr-only">Ações</span>
          </th>
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
    <div className="catalog-products">
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar produtos"
            placeholder="Buscar produto, categoria ou código…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="catalog-filters">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ProdutoStatusFilter);
              setVisible(PAGE_SIZE);
            }}
          >
            <SelectTrigger
              aria-label="Disponibilidade"
              className="h-10 w-[146px] text-xs shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Disponíveis</SelectItem>
              <SelectItem value="inativo">Indisponíveis</SelectItem>
              <SelectItem value="promocao">Promoção</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as ProdutoSort);
              setVisible(PAGE_SIZE);
            }}
          >
            <SelectTrigger
              aria-label="Ordenar produtos"
              className="h-10 w-[146px] text-xs shadow-none"
            >
              <SelectValue />
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
      <div className="catalog-list-label">
        <span>{categoriaNome}</span>
        <span>
          {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
        </span>
      </div>
      <div className="catalog-product-scroll">
        {filtered.length === 0 ? (
          <CatalogEmpty
            kind={
              search.trim() || statusFilter !== "todos" ? "busca"
                : produtos.length === 0 && selectedCategoriaId == null ? "catalogo" : "produtos"
            }
            actionLabel={
              !search.trim() && statusFilter === "todos"
                ? "Novo produto"
                : undefined
            }
            onAction={onNovoProduto}
          />
        ) : dndReady && canReorder ? (
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
          <div className="catalog-load-more">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Carregar mais ({filtered.length - visible})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
