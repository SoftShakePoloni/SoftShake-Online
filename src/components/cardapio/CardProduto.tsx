"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgePercent, Gift } from "lucide-react";
import type { Product } from "@/data/tipos";
import { hasProductPromo } from "@/data/tipos";
import { TagBadge } from "@/components/ui/TagBadge";
import { FreteGratisBadge } from "@/components/ui/FreteGratisBadge";
import { ProductDetailDialog } from "./ModalProduto";
import { PrecoProduto } from "./PrecoProduto";
import { cn } from "@/lib/utils";
import { useLoja } from "@/hooks/useLoja";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const { loja, isLoading } = useLoja();
  const isDisponivel = product.disponivel !== false;
  const lojaAberta = isLoading ? true : Boolean(loja?.esta_aberto);
  const podePedir = isDisponivel && lojaAberta;

  const handleOpen = () => {
    if (!isDisponivel) return;
    if (!lojaAberta) {
      toast.error("Loja fechada", {
        description: "No momento não estamos aceitando pedidos.",
      });
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <article
        onClick={handleOpen}
        className={cn(
          "group relative flex h-full gap-3 overflow-hidden rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md",
          "border-border bg-card",
          podePedir ? "cursor-pointer" : "cursor-not-allowed opacity-75",
        )}
      >
        {/* Fita de Esgotado */}
        {!isDisponivel && (
          <>
            {/* Overlay escuro */}
            <div className="absolute inset-0 bg-black/20 z-10" />

            {/* Fita diagonal */}
            <div className="absolute top-6 -right-12 z-20 w-48 rotate-45 bg-gradient-to-r from-red-600 to-red-500 py-2 text-center shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-md">
                Esgotado
              </span>
            </div>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col relative z-[5]">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {product.tag && <TagBadge tag={product.tag} />}
            {product.freteGratis && isDisponivel && (
              <FreteGratisBadge prazo={product.freteGratisPrazo} />
            )}
            {hasProductPromo(product) && isDisponivel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F1EAF8] px-2 py-1 text-[10px] font-semibold leading-none text-[#432078]">
                <BadgePercent
                  aria-hidden="true"
                  className="h-3 w-3"
                  strokeWidth={2.4}
                />
                Promoção
              </span>
            )}
          </div>
          <h3
            className={cn(
              "text-base font-bold",
              isDisponivel ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {product.name}
          </h3>
          <p
            className={cn(
              "mt-1 line-clamp-3 text-sm",
              isDisponivel
                ? "text-muted-foreground"
                : "text-muted-foreground/70",
            )}
          >
            {product.description}
          </p>
          <div className={cn("mt-auto pt-3", !isDisponivel && "opacity-70")}>
            <PrecoProduto product={product} size="sm" />
          </div>
        </div>
        <div className="shrink-0 relative z-[5]">
          {product.image ? (
            <div className="relative">
              <Image
                src={product.image}
                alt={product.name}
                width={320}
                height={192}
                quality={90}
                className="h-24 w-24 rounded-lg object-cover sm:h-28 sm:w-28"
              />
            </div>
          ) : (
            <div className="relative flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-28 sm:w-28">
              <Gift className="h-8 w-8" />
            </div>
          )}
        </div>
      </article>
      {isDisponivel && (
        <ProductDetailDialog
          product={product}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
