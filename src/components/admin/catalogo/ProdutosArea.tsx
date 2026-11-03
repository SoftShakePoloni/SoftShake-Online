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
import {
  BadgePercent,
  CirclePause,
  CircleCheck,
  LayoutGrid,
  List,
  Package,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProdutoRow } from "./ProdutoRow";
import { ProdutoCard } from "./ProdutoCard";
import { CatalogEmpty } from "./CatalogEmpty";
import type {
  CatalogCategoria,
  CatalogProduto,
  ProdutoSort,
  ProdutoStatusFilter,
} from "./types";
import { produtoStatus } from "./types";

const PAGE_SIZE = 50;
const VIEW_KEY = "softshake:admin-catalogo:view";
type View = "lista" | "grade";

const STATUS_CARDS: {
  id: ProdutoStatusFilter;
  label: string;
  icon: typeof Package;
  tone: string;
}[] = [
  { id: "todos", label: "Todos", icon: Package, tone: "brand" },
  { id: "ativo", label: "À venda", icon: CircleCheck, tone: "success" },
  { id: "inativo", label: "Pausados", icon: CirclePause, tone: "muted" },
  { id: "promocao", label: "Em promoção", icon: BadgePercent, tone: "warning" },
];

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "grade" ? "grade" : "lista";
  } catch {
    return "lista";
  }
}

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
  const [statusFilter, setStatusFilter] = useState<ProdutoStatusFilter>("todos");
  const [sort, setSort] = useState<ProdutoSort>("ordem");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [view, setView] = useState<View>("lista");
  const [dndReady, setDndReady] = useState(false);

  useEffect(() => {
    setDndReady(true);
    setView(readView());
  }, []);

  const changeView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* preferência opcional */
    }
  };

  const categoriaNome = useMemo(() => {
    if (selectedCategoriaId == null) return "Todos os produtos";
    if (selectedCategoriaId === "__none__") return "Sem categoria";
    return (
      categorias.find((c) => String(c.id) === selectedCategoriaId)?.nome ||
      "Categoria"
    );
  }, [categorias, selectedCategoriaId]);

  // Categoria + busca: base para os contadores dos cards de status.
  const scoped = useMemo(() => {
    let list = produtos;
    if (selectedCategoriaId === "__none__") {
      list = list.filter((p) => p.categoria_id == null);
    } else if (selectedCategoriaId != null) {
      list = list.filter((p) => String(p.categoria_id) === selectedCategoriaId);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.nome, p.descricao || "", p.categoria?.nome || "", p.codigo || "", String(p.id)]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [produtos, selectedCategoriaId, search]);

  const counts = useMemo(() => {
    const c: Record<ProdutoStatusFilter, number> = {
      todos: scoped.length,
      ativo: 0,
      inativo: 0,
      promocao: 0,
    };
    for (const p of scoped) c[produtoStatus(p)]++;
    return c;
  }, [scoped]);

  const filtered = useMemo(() => {
    const list =
      statusFilter === "todos"
        ? scoped.slice()
        : scoped.filter((p) => produtoStatus(p) === statusFilter);
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
  }, [scoped, statusFilter, sort]);

  const page = filtered.slice(0, visible);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canReorder =
    view === "lista" &&
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

  const actionsFor = (p: CatalogProduto) => ({
    onEdit: () => onEdit(p),
    onDuplicate: () => onDuplicate(p),
    onView: () => onView(p),
    onDelete: () => onDelete(p),
    onToggleDisponivel: () => onToggleDisponivel(p),
  });

  const renderTable = (enableDnd: boolean) => (
    <table className="catalog-product-table">
      <caption className="sr-only">{categoriaNome}</caption>
      <thead>
        <tr>
          <th aria-label="Reordenação" />
          <th scope="col">Produto</th>
          <th scope="col">Categoria</th>
          <th scope="col">Preço</th>
          <th scope="col">Vendas</th>
          <th scope="col">
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {page.map((p) => (
          <ProdutoRow key={p.id} produto={p} enableDnd={enableDnd} {...actionsFor(p)} />
        ))}
      </tbody>
    </table>
  );

  const reorderHint =
    view === "lista" && !canReorder && sort === "ordem"
      ? "Escolha uma categoria, sem busca ou filtro, para arrastar e reordenar."
      : null;

  return (
    <section className="catalog-products" aria-label="Produtos">
      <div className="catalog-stats" role="group" aria-label="Filtrar por situação">
        {STATUS_CARDS.map(({ id, label, icon: Icon, tone }) => (
          <button
            key={id}
            type="button"
            aria-pressed={statusFilter === id}
            className={cn("catalog-stat", `tone-${tone}`, statusFilter === id && "is-active")}
            onClick={() => {
              setStatusFilter(id);
              setVisible(PAGE_SIZE);
            }}
          >
            <span className="catalog-stat-icon" aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
            <span className="catalog-stat-text">
              <span className="catalog-stat-value">{counts[id]}</span>
              <span className="catalog-stat-label">{label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar produtos"
            placeholder="Buscar por nome, descrição ou código"
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setVisible(PAGE_SIZE);
            }}
          />
          {search ? (
            <button
              type="button"
              className="catalog-search-clear"
              aria-label="Limpar busca"
              onClick={() => onSearchChange("")}
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : (
            <kbd className="catalog-kbd" aria-hidden="true">/</kbd>
          )}
        </div>
        <div className="catalog-filters">
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as ProdutoSort);
              setVisible(PAGE_SIZE);
            }}
          >
            <SelectTrigger aria-label="Ordenar produtos" className="catalog-sort shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ordem">Ordem do cardápio</SelectItem>
              <SelectItem value="nome">Nome (A–Z)</SelectItem>
              <SelectItem value="preco_asc">Menor preço</SelectItem>
              <SelectItem value="preco_desc">Maior preço</SelectItem>
              <SelectItem value="recentes">Mais recentes</SelectItem>
            </SelectContent>
          </Select>
          <div className="catalog-view-toggle" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              aria-pressed={view === "lista"}
              aria-label="Ver em lista"
              onClick={() => changeView("lista")}
            >
              <List size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={view === "grade"}
              aria-label="Ver em grade"
              onClick={() => changeView("grade")}
            >
              <LayoutGrid size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="catalog-list-label">
        <h2>{categoriaNome}</h2>
        <span>
          {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
        </span>
        {reorderHint && <p className="catalog-list-hint">{reorderHint}</p>}
      </div>

      {filtered.length === 0 ? (
        <div className="catalog-surface">
          <CatalogEmpty
            kind={
              search.trim() || statusFilter !== "todos"
                ? "busca"
                : produtos.length === 0 && selectedCategoriaId == null
                  ? "catalogo"
                  : "produtos"
            }
            actionLabel={!search.trim() && statusFilter === "todos" ? "Novo produto" : undefined}
            onAction={onNovoProduto}
          />
        </div>
      ) : view === "grade" ? (
        <ul className="catalog-grid">
          {page.map((p) => (
            <ProdutoCard key={p.id} produto={p} {...actionsFor(p)} />
          ))}
        </ul>
      ) : (
        <div className="catalog-surface">
          {dndReady && canReorder ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={page.map((p) => String(p.id))} strategy={verticalListSortingStrategy}>
                {renderTable(true)}
              </SortableContext>
            </DndContext>
          ) : (
            renderTable(false)
          )}
        </div>
      )}

      {visible < filtered.length && (
        <div className="catalog-load-more">
          <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Mostrar mais {Math.min(PAGE_SIZE, filtered.length - visible)} de{" "}
            {filtered.length - visible} restantes
          </button>
        </div>
      )}
    </section>
  );
}
