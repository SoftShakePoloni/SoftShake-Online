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
        "group border-b border-[#F1EEF3] transition-colors hover:bg-[#FCFBFD]",
        isDragging && "relative z-10 bg-white opacity-90 shadow-sm",
        !disponivel && "opacity-70"
      )}
    >
      {/* Drag */}
      <td className="w-10 py-3 pl-3 pr-0">
        {dragHandleProps ? (
          <button
            type="button"
            className="touch-none cursor-grab p-1 text-[#AAA4B0] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            aria-label="Arrastar produto"
            {...dragHandleProps}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </td>

      {/* Produto */}
      <td className="py-3 pr-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full min-w-0 items-center gap-3 text-left"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#EFECF1] bg-[#F8F7F9]">
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
                <Package className="h-4 w-4 text-[#B8B2BE]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight text-[#29252E]">
              {produto.nome}
            </p>
            {produto.codigo ? (
              <p className="mt-1 text-[11px] tabular-nums text-[#96909B]">
                {produto.codigo}
              </p>
            ) : (
              <p className="mt-1 line-clamp-1 text-[11px] text-[#96909B]">
                {(produto.descricao || "").trim() || "—"}
              </p>
            )}
          </div>
        </button>
      </td>

      {/* Categoria — ocultar em tablet pequeno */}
      <td className="hidden py-3 pr-4 md:table-cell">
        <span className="text-[12px] text-[#716B77]">
          {produto.categoria?.nome || "Sem categoria"}
        </span>
      </td>

      {/* Preço */}
      <td className="whitespace-nowrap py-3 pr-4">
        {promo ? (
          <div>
            <p className="text-[13px] font-semibold tabular-nums text-[#29252E]">
              {formatBRL(produto.preco_promocional)}
            </p>
            <p className="text-[11px] tabular-nums text-[#96909B] line-through">
              {formatBRL(produto.preco_base)}
            </p>
          </div>
        ) : (
          <p className="text-[13px] font-semibold tabular-nums text-[#29252E]">
            {formatBRL(produto.preco_base)}
          </p>
        )}
      </td>

      {/* Status */}
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-medium",
              disponivel
                ? "border-[#DDEDE4] bg-[#F1F8F3] text-[#3F7351]"
                : "border-[#E8E5EA] bg-[#F6F5F7] text-[#77717D]"
            )}
          >
            {disponivel ? "Disponível" : "Indisponível"}
          </span>
          {promo && (
            <span className="inline-flex items-center rounded-md border border-[#E5DDF0] bg-[#F6F2FA] px-2 py-1 text-[10px] font-medium text-[#65468B]">
              Promoção
            </span>
          )}
        </div>
      </td>

      {/* Disponível switch — ocultar em mobile */}
      <td className="hidden py-3 pr-4 sm:table-cell">
        <Switch
          checked={disponivel}
          disabled={toggling}
          onCheckedChange={() => onToggleDisponivel()}
          className="h-5 w-9 data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-[#D1D5DB] [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
          aria-label={disponivel ? "Desativar" : "Ativar"}
        />
      </td>

      {/* Atualização — desktop */}
      <td className="hidden py-3 pr-4 lg:table-cell">
        <span className="text-[11px] tabular-nums text-[#96909B]">{updated}</span>
      </td>

      {/* Ações */}
      <td className="py-3 pr-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#716B77] transition-colors hover:border-[#E7E3EA] hover:bg-white hover:text-[#29252E]"
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
