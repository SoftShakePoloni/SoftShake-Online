"use client";

import { cn } from "@/lib/utils";

export type CatalogTagLike = {
  id?: string | number;
  nome: string;
  cor_fundo?: string | null;
  cor_texto?: string | null;
} | null | undefined;

/** Badge igual ao do cardápio (cliente) — cores da tabela tags */
export function CatalogTagBadge({
  tag,
  className,
  size = "sm",
}: {
  tag: CatalogTagLike;
  className?: string;
  size?: "sm" | "md";
}) {
  if (!tag?.nome) return null;
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-md font-bold tracking-wide shrink-0",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className
      )}
      style={{
        backgroundColor: tag.cor_fundo || "#F3EEFA",
        color: tag.cor_texto || "#4C258C",
      }}
    >
      {tag.nome}
    </span>
  );
}
