"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift } from "lucide-react";
import type { Product } from "@/data/tipos";
import { formatBRL } from "@/data/tipos";
import { TagBadge } from "@/components/ui/TagBadge";
import { ProductDetailDialog } from "./ModalProduto";

export function ProductCard({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article
        onClick={() => setOpen(true)}
        className="group flex h-full cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          {product.tag && (
            <span className="mb-2">
              <TagBadge tag={product.tag} />
            </span>
          )}
          <h3 className="text-base font-bold text-foreground">{product.name}</h3>
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
          <p className="mt-auto pt-3 text-sm font-bold text-foreground">{formatBRL(product.price)}</p>
        </div>
        <div className="shrink-0">
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
      <ProductDetailDialog product={product} open={open} onOpenChange={setOpen} />
    </>
  );
}
