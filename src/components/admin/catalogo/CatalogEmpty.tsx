"use client";

import { Package, FolderOpen, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyKind =
  | "produtos"
  | "categorias"
  | "busca"
  | "complementos"
  | "coming";

const COPY: Record<
  EmptyKind,
  { icon: typeof Package; title: string; description: string }
> = {
  produtos: {
    icon: Package,
    title: "Nenhum produto nesta categoria",
    description:
      "Crie o primeiro produto ou mova itens existentes para esta categoria.",
  },
  categorias: {
    icon: FolderOpen,
    title: "Nenhuma categoria ainda",
    description: "Organize o cardápio criando categorias como Açaís, Bebidas…",
  },
  busca: {
    icon: Package,
    title: "Nenhum resultado",
    description: "Tente outro termo, filtro ou categoria.",
  },
  complementos: {
    icon: Layers,
    title: "Nenhum grupo de complementos",
    description: "Crie grupos como Caldas, Frutas e Coberturas.",
  },
  coming: {
    icon: Sparkles,
    title: "Em breve",
    description: "Esta área do catálogo ainda está em desenvolvimento.",
  },
};

export function CatalogEmpty({
  kind,
  actionLabel,
  onAction,
  className,
}: {
  kind: EmptyKind;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const cfg = COPY[kind];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#F3EEFA] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#4C258C]" />
      </div>
      <h3 className="text-base font-semibold text-[#111827] mb-1">
        {cfg.title}
      </h3>
      <p className="text-sm text-[#6B7280] max-w-sm mb-5 leading-relaxed">
        {cfg.description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#4C258C] hover:bg-[#5E35B1] text-white rounded-xl"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
