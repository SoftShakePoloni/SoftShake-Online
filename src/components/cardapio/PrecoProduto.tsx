"use client";

import { Percent } from "lucide-react";
import {
  formatBRL,
  getProductUnitPrice,
  hasProductPromo,
  productDiscountPercent,
  type Product,
} from "@/data/tipos";
import { cn } from "@/lib/utils";

/**
 * Exibe preço do produto no cardápio.
 * Com promoção: preço antigo riscado + preço promo em roxo SoftShake + selo % off.
 */
export function PrecoProduto({
  product,
  className,
  size = "md",
  showBadge = true,
}: {
  product: Product;
  className?: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}) {
  const promo = hasProductPromo(product);
  const unit = getProductUnitPrice(product);
  const pct = productDiscountPercent(product);

  const priceCls =
    size === "lg"
      ? "text-lg font-bold"
      : size === "sm"
        ? "text-sm font-bold"
        : "text-sm font-bold sm:text-base";

  if (!promo) {
    return (
      <p className={cn(priceCls, "text-foreground tabular-nums", className)}>
        {formatBRL(unit)}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-muted-foreground line-through tabular-nums">
          {formatBRL(product.price)}
        </span>
        <span className={cn(priceCls, "tabular-nums text-primary")}>
          {formatBRL(unit)}
        </span>
      </div>
      {showBadge && pct > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm shadow-primary/25">
          <Percent className="h-3 w-3" />
          {pct}% OFF
        </span>
      )}
    </div>
  );
}
