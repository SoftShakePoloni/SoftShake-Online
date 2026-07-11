"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/tipos";
import {
  formatBRL,
  getProductUnitPrice,
} from "@/data/tipos";
import { useCarrinho } from "@/context/CarrinhoContext";
import { useLoja } from "@/hooks/useLoja";
import { ProductDetailDialog } from "@/components/cardapio/ModalProduto";
import { cn } from "@/lib/utils";
import { PromoBadge } from "./PromoBadge";
import { PromoCountdown } from "./PromoCountdown";
import {
  getPromoBadges,
  productNeedsOptions,
  productSavings,
} from "./promo-utils";

type Variant = "grid" | "featured";

export function PromoProductCard({
  product,
  variant = "grid",
}: {
  product: Product;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const { adicionarItem } = useCarrinho();
  const { loja, isLoading } = useLoja();
  const lojaAberta = isLoading ? true : Boolean(loja?.esta_aberto);
  const disponivel = product.disponivel !== false;
  const unit = getProductUnitPrice(product);
  const savings = productSavings(product);
  const needsOptions = productNeedsOptions(product);
  const badges = getPromoBadges(product);
  const featured = variant === "featured";

  const openProduct = () => {
    if (!disponivel) return;
    if (!lojaAberta) {
      toast.error("Loja fechada", {
        description: "No momento não estamos aceitando pedidos.",
      });
      return;
    }
    setOpen(true);
  };

  const handlePrimary = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disponivel) return;
    if (!lojaAberta) {
      toast.error("Loja fechada", {
        description: "No momento não estamos aceitando pedidos.",
      });
      return;
    }
    if (needsOptions) {
      setOpen(true);
      return;
    }
    adicionarItem({
      produto: product,
      qty: 1,
      selections: {},
      observacoes: "",
      total: unit,
    });
    setBump(true);
    window.setTimeout(() => setBump(false), 220);
    toast.success("Adicionado ao carrinho", {
      description: product.name,
    });
  };

  return (
    <>
      <article
        onClick={openProduct}
        className={cn(
          "group flex flex-col overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white",
          "transition-[box-shadow,transform,border-color] duration-150 ease-out",
          disponivel
            ? "cursor-pointer hover:border-[#D4C4F0] hover:shadow-[0_4px_20px_rgba(76,37,140,0.08)]"
            : "cursor-not-allowed opacity-70",
          featured && "min-w-[280px] w-[280px] sm:min-w-[300px] sm:w-[300px] snap-start",
          bump && "scale-[0.99]"
        )}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden bg-[#F7F7F8]",
            featured ? "aspect-[4/3]" : "aspect-[5/4]"
          )}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
              sizes={featured ? "300px" : "(max-width:640px) 100vw, 33vw"}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#C4C4C8]">
              <Gift className="h-10 w-10" />
            </div>
          )}

          {badges.length > 0 && (
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 max-w-[85%]">
              {badges.map((b) => (
                <PromoBadge key={b.kind + b.label} badge={b} />
              ))}
            </div>
          )}

          {!disponivel && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#111827]">
                Indisponível
              </span>
            </div>
          )}
        </div>

        <div className={cn("flex flex-1 flex-col p-3.5", featured && "p-4")}>
          <h3
            className={cn(
              "font-semibold text-[#111827] leading-snug line-clamp-2",
              featured ? "text-[15px]" : "text-sm"
            )}
          >
            {product.name}
          </h3>
          {product.description ? (
            <p className="mt-1 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          ) : null}

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xs text-[#9CA3AF] line-through tabular-nums">
              {formatBRL(product.price)}
            </span>
            <span
              className={cn(
                "font-bold tabular-nums text-[#4C258C]",
                featured ? "text-lg" : "text-base"
              )}
            >
              {formatBRL(unit)}
            </span>
          </div>

          {savings > 0 && (
            <p className="mt-0.5 text-[11px] font-medium text-[#4C258C]/80">
              Economize {formatBRL(savings)}
            </p>
          )}

          <div className="mt-2">
            <PromoCountdown />
          </div>

          <button
            type="button"
            onClick={handlePrimary}
            disabled={!disponivel}
            className={cn(
              "mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-150",
              disponivel
                ? "bg-[#4C258C] text-white hover:bg-[#5E35B1] active:bg-[#3d1d70]"
                : "bg-[#E5E7EB] text-[#9CA3AF]"
            )}
          >
            {needsOptions ? (
              <>Escolher opções</>
            ) : (
              <>
                {featured ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                {featured ? "Adicionar" : "Adicionar ao carrinho"}
              </>
            )}
          </button>
        </div>
      </article>

      {disponivel && (
        <ProductDetailDialog
          product={product}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
