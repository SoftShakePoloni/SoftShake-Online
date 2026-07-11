"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift } from "lucide-react";
import type { Product } from "@/data/tipos";
import { hasProductPromo } from "@/data/tipos";
import { TagBadge } from "@/components/ui/TagBadge";
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
          "group flex h-full gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md relative overflow-hidden",
          podePedir ? "cursor-pointer" : "cursor-not-allowed opacity-75"
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
            {hasProductPromo(product) && isDisponivel && (
              <span className="inline-flex rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Promo
              </span>
            )}
          </div>
          <h3 className={cn(
            "text-base font-bold",
            isDisponivel ? "text-foreground" : "text-muted-foreground"
          )}>
            {product.name}
          </h3>
          <p className={cn(
            "mt-1 line-clamp-3 text-sm",
            isDisponivel ? "text-muted-foreground" : "text-muted-foreground/70"
          )}>
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
                width={120}
                height={120}
                className="h-24 w-24 rounded-lg object-cover sm:h-28 sm:w-28"
              />
              {hasProductPromo(product) && isDisponivel && (
                <span className="absolute -left-1 -top-1 rounded-md bg-gradient-to-br from-[#4C258C] to-[#7C3AED] px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-md shadow-[#4C258C]/30">
                  Oferta
                </span>
              )}
            </div>
          ) : (
            <div className="relative flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-28 sm:w-28">
              <Gift className="h-8 w-8" />
              {hasProductPromo(product) && isDisponivel && (
                <span className="absolute -left-1 -top-1 rounded-md bg-gradient-to-br from-[#4C258C] to-[#7C3AED] px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-md shadow-[#4C258C]/30">
                  Oferta
                </span>
              )}
            </div>
          )}
        </div>
      </article>
      {isDisponivel && (
        <ProductDetailDialog product={product} open={open} onOpenChange={setOpen} />
      )}
    </>
  );
}
