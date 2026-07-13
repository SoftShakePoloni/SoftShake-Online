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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  MoreVertical,
  GripVertical,
  Pencil,
  Copy,
  EyeOff,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CatalogCategoria, CatalogProduto } from "./types";

const ALL_ID = "__all__";

function CategoriaItem({
  cat,
  count,
  selected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  enableDnd = false,
}: {
  cat: CatalogCategoria;
  count: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  enableDnd?: boolean;
}) {
  if (enableDnd) {
    return (
      <CategoriaItemSortable
        cat={cat}
        count={count}
        selected={selected}
        onSelect={onSelect}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    );
  }
  return (
    <CategoriaItemInner
      cat={cat}
      count={count}
      selected={selected}
      onSelect={onSelect}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    />
  );
}

function CategoriaItemSortable(
  props: Omit<Parameters<typeof CategoriaItemInner>[0], "setNodeRef" | "style" | "dragHandleProps" | "isDragging">
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(props.cat.id) });

  return (
    <CategoriaItemInner
      {...props}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

function CategoriaItemInner({
  cat,
  count,
  selected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  setNodeRef,
  style,
  isDragging,
  dragHandleProps,
}: {
  cat: CatalogCategoria;
  count: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-0.5 rounded-md transition-colors",
        isDragging && "opacity-80 z-20 bg-white border border-[#E5E7EB]",
        selected
          ? "bg-[#F3F4F6] text-[#111827]"
          : "hover:bg-[#F9FAFB] text-[#374151]"
      )}
    >
      {dragHandleProps ? (
        <button
          type="button"
          className="p-1 pl-1.5 text-[#D1D5DB] opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Arrastar categoria"
          {...dragHandleProps}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="w-5 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 flex items-center gap-1.5 py-2 pr-1 text-left"
      >
        <span
          className={cn(
            "truncate text-[13px]",
            selected ? "font-semibold" : "font-medium"
          )}
        >
          {cat.nome}
        </span>
        <span
          className={cn(
            "ml-auto text-[12px] tabular-nums shrink-0",
            selected ? "text-[#6B7280]" : "text-[#9CA3AF]"
          )}
        >
          ({count})
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1 mr-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white text-[#6B7280]"
            aria-label="Menu da categoria"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5 mr-2" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <EyeOff className="w-3.5 h-3.5 mr-2" />
            Ocultar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function CategoriasSidebar({
  categorias,
  produtos,
  selectedId,
  onSelect,
  onReorder,
  onCreate,
  onUpdate,
  onDuplicate,
  onDelete,
}: {
  categorias: CatalogCategoria[];
  produtos: CatalogProduto[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (orderedIds: string[]) => void;
  onCreate: (nome: string) => Promise<void>;
  onUpdate: (id: string | number, nome: string) => Promise<void>;
  onDuplicate: (id: string | number) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dndReady, setDndReady] = useState(false);
  useEffect(() => {
    setDndReady(true);
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of produtos) {
      const key =
        p.categoria_id != null ? String(p.categoria_id) : "__none__";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [produtos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = categorias.map((c) => String(c.id));
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  const submitCreate = async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate(newName.trim());
      setNewName("");
      setCreating(false);
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!editingId || !editName.trim() || busy) return;
    setBusy(true);
    try {
      await onUpdate(editingId, editName.trim());
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || busy) return;
    setBusy(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="w-full lg:w-[220px] shrink-0 border-r border-[#E5E7EB] bg-white flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5E7EB]">
        <h2 className="text-[13px] font-semibold text-[#111827]">Categorias</h2>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-md text-[#6B7280] hover:bg-[#F3F4F6]"
          onClick={() => {
            setCreating(true);
            setNewName("");
          }}
          aria-label="Nova categoria"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] transition-colors",
            selectedId == null
              ? "bg-[#F3F4F6] text-[#111827] font-semibold"
              : "text-[#374151] hover:bg-[#F9FAFB] font-medium"
          )}
        >
          <span className="truncate">Todas</span>
          <span className="ml-auto text-[12px] tabular-nums text-[#9CA3AF]">
            ({produtos.length})
          </span>
        </button>

        {creating && (
          <div className="flex gap-1 p-1">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitCreate();
                if (e.key === "Escape") setCreating(false);
              }}
              placeholder="Nome da categoria"
              className="h-9 text-sm rounded-lg"
            />
            <Button
              size="sm"
              className="h-9 bg-[#4C258C] hover:bg-[#5E35B1]"
              disabled={busy}
              onClick={() => void submitCreate()}
            >
              OK
            </Button>
          </div>
        )}

        {(() => {
          const renderCat = (cat: CatalogCategoria, enableDnd: boolean) =>
            editingId === String(cat.id) ? (
              <div key={cat.id} className="flex gap-1 p-1">
                <Input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-9 text-sm rounded-lg"
                />
                <Button
                  size="sm"
                  className="h-9 bg-[#4C258C] hover:bg-[#5E35B1]"
                  disabled={busy}
                  onClick={() => void submitEdit()}
                >
                  OK
                </Button>
              </div>
            ) : (
              <CategoriaItem
                key={cat.id}
                cat={cat}
                enableDnd={enableDnd}
                count={counts.get(String(cat.id)) || 0}
                selected={selectedId === String(cat.id)}
                onSelect={() => onSelect(String(cat.id))}
                onEdit={() => {
                  setEditingId(String(cat.id));
                  setEditName(cat.nome);
                }}
                onDuplicate={() => void onDuplicate(cat.id)}
                onDelete={() => setDeleteId(String(cat.id))}
              />
            );

          if (!dndReady) {
            return categorias.map((cat) => renderCat(cat, false));
          }

          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categorias.map((c) => String(c.id))}
                strategy={verticalListSortingStrategy}
              >
                {categorias.map((cat) => renderCat(cat, true))}
              </SortableContext>
            </DndContext>
          );
        })()}

        {(counts.get("__none__") || 0) > 0 && (
          <button
            type="button"
            onClick={() => onSelect("__none__")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors",
              selectedId === "__none__"
                ? "bg-[#F3EEFA] text-[#4C258C] font-semibold"
                : "text-[#6B7280] hover:bg-[#F7F8FC]"
            )}
          >
            <span className="truncate">Sem categoria</span>
            <span className="ml-auto text-[11px] tabular-nums">
              {counts.get("__none__")}
            </span>
          </button>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Os produtos desta categoria ficarão sem categoria. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

export { ALL_ID };
