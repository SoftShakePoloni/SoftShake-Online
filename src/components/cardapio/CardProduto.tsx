"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift } from "lucide-react";
import type { Product } from "@/data/tipos";
import { formatBRL } from "@/data/tipos";
import { TagBadge } from "@/components/ui/TagBadge";
import { ProductDetailDialog } from "./ModalProduto";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const isDisponivel = product.disponivel !== false;

  return (
    <>
      <article
        onClick={() => isDisponivel && setOpen(true)}
        className={cn(
          "group flex h-full gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md relative overflow-hidden",
          isDisponivel ? "cursor-pointer" : "cursor-not-allowed opacity-75"
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
          {product.tag && (
            <span className="mb-2">
              <TagBadge tag={product.tag} />
            </span>
          )}
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
          <p className={cn(
            "mt-auto pt-3 text-sm font-bold",
            isDisponivel ? "text-foreground" : "text-muted-foreground"
          )}>
            {formatBRL(product.price)}
          </p>
        </div>
        <div className="shrink-0 relative z-[5]">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={120}
              height={120}
              className="h-24 w-24 rounded-lg object-cover sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-28 sm:w-28">
              <Gift className="h-8 w-8" />
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
