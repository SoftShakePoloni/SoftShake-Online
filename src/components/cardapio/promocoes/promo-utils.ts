import type { Category, Product } from "@/data/tipos";
import {
  getProductUnitPrice,
  hasProductPromo,
  productDiscountPercent,
} from "@/data/tipos";

export type PromoBadgeKind =
  | "percent"
  | "mais_vendido"
  | "novidade"
  | "premium"
  | "combo"
  | "relampago"
  | "leve2";

export type PromoBadge = {
  kind: PromoBadgeKind;
  label: string;
};

export function isPromoProduct(p: Product): boolean {
  return hasProductPromo(p) && p.disponivel !== false;
}

export function productNeedsOptions(p: Product): boolean {
  return (p.optionGroups ?? []).some(
    (g) => g.id !== "obs" && (g.items?.length ?? 0) > 0
  );
}

export function productSavings(p: Product): number {
  return Math.max(0, Number(p.price) - getProductUnitPrice(p));
}

export function getPromoBadges(p: Product): PromoBadge[] {
  const badges: PromoBadge[] = [];
  const pct = productDiscountPercent(p);
  if (pct > 0) {
    badges.push({ kind: "percent", label: `${pct}% OFF` });
  }

  const tag = p.tag?.nome?.toLowerCase() ?? "";
  const name = p.name.toLowerCase();

  if (tag.includes("mais pedido") || tag.includes("mais vendido")) {
    badges.push({ kind: "mais_vendido", label: "Mais vendido" });
  } else if (tag.includes("novidade") || tag.includes("novo")) {
    badges.push({ kind: "novidade", label: "Novo" });
  } else if (tag.includes("premium")) {
    badges.push({ kind: "premium", label: "Premium" });
  }

  if (name.includes("combo") || name.includes("leve 2") || name.includes("2x")) {
    if (name.includes("leve 2") || name.includes("2x")) {
      badges.push({ kind: "leve2", label: "Leve 2" });
    } else {
      badges.push({ kind: "combo", label: "Combo" });
    }
  }

  // Oferta relâmpago: descontos altos (≥ 25%)
  if (pct >= 25 && !badges.some((b) => b.kind === "relampago")) {
    badges.push({ kind: "relampago", label: "Relâmpago" });
  }

  // no máximo 2 badges no card
  return badges.slice(0, 2);
}

export function listPromoProducts(categories: Category[]): Product[] {
  return categories.flatMap((c) => c.products.filter(isPromoProduct));
}

export function promoCategoriesOnly(categories: Category[]): Category[] {
  return categories
    .map((c) => {
      const products = c.products.filter(isPromoProduct);
      if (!products.length) return null;
      return { ...c, products };
    })
    .filter((c): c is Category => c != null);
}

export function isComboProduct(p: Product): boolean {
  const n = p.name.toLowerCase();
  return n.includes("combo") || n.includes(" + ") || n.includes(" e ");
}

/** Ms até o fim do dia local (ofertas do dia) */
export function msUntilEndOfDay(now = Date.now()): number {
  const d = new Date(now);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, end.getTime() - now);
}

export function formatCountdown(ms: number): { text: string; urgent: boolean } {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const urgent = totalSec < 3600;
  if (h > 0) {
    return {
      text: `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`,
      urgent,
    };
  }
  return {
    text: `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
    urgent: true,
  };
}
