"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import {
  GripVertical,
  Pencil,
  Copy,
  Eye,
  Trash2,
  MoreVertical,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useImagemAssinada } from "@/hooks/useImagemAssinada";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProdutoStatusBadge } from "./ProdutoStatusBadge";
import { CatalogTagBadge } from "./CatalogTagBadge";
import {
  formatBRL,
  hasPrecoPromocional,
  type CatalogProduto,
} from "./types";
import { isProdutoDisponivel } from "./types";

type ProdutoRowProps = {
  produto: CatalogProduto;
  onEdit: () => void;
  onDuplicate: () => void;
  onView: () => void;
  onDelete: () => void;
  onToggleDisponivel: () => void;
  /** Só true após mount no cliente (evita hydration mismatch do dnd-kit) */
  enableDnd?: boolean;
  toggling?: boolean;
};

export function ProdutoRow(props: ProdutoRowProps) {
  if (props.enableDnd) {
    return <ProdutoRowSortable {...props} />;
  }
  return <ProdutoRowInner {...props} />;
}

function ProdutoRowSortable(props: ProdutoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(props.produto.id) });

  return (
    <ProdutoRowInner
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

function ProdutoRowInner({
  produto,
  onEdit,
  onDuplicate,
  onView,
  onDelete,
  onToggleDisponivel,
  setNodeRef,
  style,
  isDragging,
  dragHandleProps,
  toggling = false,
}: ProdutoRowProps & {
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}) {
  const imgUrl = useImagemAssinada(produto.imagem_url);
  const desc = (produto.descricao || "").trim();
  const disponivel = isProdutoDisponivel(produto);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-3 rounded-2xl border border-transparent bg-white",
        "hover:border-[#E5E7EB] hover:shadow-sm hover:shadow-[#4C258C]/[0.04] transition-all duration-200",
        isDragging && "opacity-80 shadow-lg z-10 border-[#D4C4F0]",
        !disponivel && "opacity-75 bg-[#FAFAFA]"
      )}
    >
      {dragHandleProps ? (
        <button
          type="button"
          className="p-1 text-[#D1D5DB] opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none shrink-0"
          aria-label="Arrastar produto"
          {...dragHandleProps}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 ring-1 ring-[#E5E7EB]">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={produto.nome}
              fill
              className="object-cover"
              sizes="56px"
              loading="lazy"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-6 h-6 text-[#D1D5DB]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[#111827] truncate">
              {produto.nome}
            </h3>
            <ProdutoStatusBadge produto={produto} />
            {produto.tag?.nome && (
              <CatalogTagBadge tag={produto.tag} size="md" />
            )}
          </div>
          {desc ? (
            <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{desc}</p>
          ) : (
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {produto.categoria?.nome || "Sem categoria"}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {hasPrecoPromocional(produto) ? (
              <>
                <span className="text-xs text-[#9CA3AF] line-through tabular-nums">
                  {formatBRL(produto.preco_base)}
                </span>
                <span className="text-sm font-bold text-[#4C258C] tabular-nums">
                  {formatBRL(Number(produto.preco_promocional))}
                </span>
                <span className="text-[9px] font-bold uppercase text-[#4C258C] bg-[#F3EEFA] border border-[#D4C4F0] px-1.5 py-0.5 rounded">
                  Promo
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-[#111827] tabular-nums">
                {formatBRL(produto.preco_base)}
              </span>
            )}
            <span className="text-[10px] text-[#9CA3AF] tabular-nums hidden sm:inline">
              #{produto.id}
            </span>
          </div>
        </div>
      </button>

      {/* Switch de disponibilidade — sempre visível */}
      <div
        className="flex flex-col items-center gap-0.5 shrink-0 px-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Switch
          checked={disponivel}
          disabled={toggling}
          onCheckedChange={() => onToggleDisponivel()}
          className="data-[state=checked]:bg-[#4C258C] data-[state=unchecked]:bg-[#D1D5DB]"
          aria-label={
            disponivel ? "Desativar produto" : "Ativar produto"
          }
        />
        <span
          className={cn(
            "text-[9px] font-semibold uppercase tracking-wide",
            disponivel ? "text-emerald-600" : "text-[#9CA3AF]"
          )}
        >
          {disponivel ? "Ativo" : "Off"}
        </span>
      </div>

      <div
        className={cn(
          "flex items-center gap-0.5 shrink-0 transition-all duration-200",
          "opacity-100 sm:opacity-0 sm:translate-x-1 sm:group-hover:opacity-100 sm:group-hover:translate-x-0",
          "focus-within:opacity-100 focus-within:translate-x-0"
        )}
      >
        <IconBtn label="Editar" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5" />
        </IconBtn>
        <IconBtn label="Duplicar" onClick={onDuplicate}>
          <Copy className="w-3.5 h-3.5" />
        </IconBtn>
        <IconBtn label="Visualizar" onClick={onView}>
          <Eye className="w-3.5 h-3.5" />
        </IconBtn>
        <IconBtn label="Excluir" onClick={onDelete} danger>
          <Trash2 className="w-3.5 h-3.5" />
        </IconBtn>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6]"
              aria-label="Mais ações"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>Duplicar</DropdownMenuItem>
            <DropdownMenuItem onClick={onView}>Visualizar</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleDisponivel} disabled={toggling}>
              {disponivel ? "Desativar produto" : "Ativar produto"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        danger
          ? "text-[#9CA3AF] hover:text-red-600 hover:bg-red-50"
          : "text-[#6B7280] hover:text-[#4C258C] hover:bg-[#F3EEFA]"
      )}
    >
      {children}
    </button>
  );
}
