"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  GripVertical,
  Pencil,
  Copy,
  Eye,
  Trash2,
  MoreHorizontal,
  Package,
  Tag,
  EyeOff,
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
import {
  formatBRL,
  hasPrecoPromocional,
  isProdutoDisponivel,
  type CatalogProduto,
} from "./types";

type ProdutoRowProps = {
  produto: CatalogProduto;
  onEdit: () => void;
  onDuplicate: () => void;
  onView: () => void;
  onDelete: () => void;
  onToggleDisponivel: () => void;
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
  const disponivel = isProdutoDisponivel(produto);
  const promo = hasPrecoPromocional(produto);
  const updated =
    produto.updated_at || produto.created_at
      ? format(
          new Date(produto.updated_at || produto.created_at!),
          "dd/MM/yy",
          { locale: ptBR }
        )
      : "—";

  return (
    <tr
      ref={setNodeRef as unknown as React.Ref<HTMLTableRowElement>}
      style={style}
      className={cn(
        "group border-b border-[#F3F4F6] hover:bg-[#FAFAFA]",
        isDragging && "bg-white shadow-sm opacity-90 relative z-10",
        !disponivel && "opacity-70"
      )}
    >
      {/* Drag */}
      <td className="w-8 py-2 pl-2 pr-0">
        {dragHandleProps ? (
          <button
            type="button"
            className="p-1 text-[#D1D5DB] opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Arrastar produto"
            {...dragHandleProps}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </td>

      {/* Produto */}
      <td className="py-2 pr-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-2.5 min-w-0 text-left w-full"
        >
          <div className="relative w-12 h-12 shrink-0 rounded border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden">
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="w-4 h-4 text-[#D1D5DB]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-[#111827] truncate leading-tight">
              {produto.nome}
            </p>
            {produto.codigo ? (
              <p className="text-[11px] text-[#9CA3AF] tabular-nums mt-0.5">
                {produto.codigo}
              </p>
            ) : (
              <p className="text-[11px] text-[#9CA3AF] mt-0.5 line-clamp-1">
                {(produto.descricao || "").trim() || "—"}
              </p>
            )}
          </div>
        </button>
      </td>

      {/* Categoria — ocultar em tablet pequeno */}
      <td className="py-2 pr-3 hidden md:table-cell">
        <span className="text-[13px] text-[#6B7280]">
          {produto.categoria?.nome || "Sem categoria"}
        </span>
      </td>

      {/* Preço */}
      <td className="py-2 pr-3 whitespace-nowrap">
        {promo ? (
          <div>
            <p className="text-[15px] font-bold text-[#111827] tabular-nums">
              {formatBRL(produto.preco_promocional)}
            </p>
            <p className="text-[11px] text-[#9CA3AF] line-through tabular-nums">
              {formatBRL(produto.preco_base)}
            </p>
          </div>
        ) : (
          <p className="text-[15px] font-bold text-[#111827] tabular-nums">
            {formatBRL(produto.preco_base)}
          </p>
        )}
      </td>

      {/* Status */}
      <td className="py-2 pr-3">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border",
              disponivel
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
            )}
          >
            {disponivel ? "Disponível" : "Indisponível"}
          </span>
          {promo && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border bg-orange-50 text-orange-700 border-orange-100">
              Promoção
            </span>
          )}
        </div>
      </td>

      {/* Disponível switch — ocultar em mobile */}
      <td className="py-2 pr-3 hidden sm:table-cell">
        <Switch
          checked={disponivel}
          disabled={toggling}
          onCheckedChange={() => onToggleDisponivel()}
          className="h-5 w-9 data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-[#D1D5DB] [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
          aria-label={disponivel ? "Desativar" : "Ativar"}
        />
      </td>

      {/* Atualização — desktop */}
      <td className="py-2 pr-3 hidden lg:table-cell">
        <span className="text-[12px] text-[#9CA3AF] tabular-nums">{updated}</span>
      </td>

      {/* Ações */}
      <td className="py-2 pr-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-transparent text-[#6B7280] hover:border-[#E5E7EB] hover:bg-white"
              aria-label="Ações"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 text-[13px]">
            <DropdownMenuItem className="text-[13px]" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px]" onClick={onDuplicate}>
              <Copy className="w-3.5 h-3.5 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px]" onClick={onEdit}>
              <Tag className="w-3.5 h-3.5 mr-2" />
              Promoção
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[13px]"
              onClick={onToggleDisponivel}
            >
              {disponivel ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 mr-2" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 mr-2" />
                  Exibir
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px]" onClick={onView}>
              <Eye className="w-3.5 h-3.5 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[13px] text-red-600 focus:text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
