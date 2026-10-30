"use client";
import { useState } from "react";
import { StorageImage as Image } from "@/components/ui/storage-image";
import type { Product } from "@/data/tipos";
import {
  productDiscountPercent,
  getProductUnitPrice,
  formatBRL,
  hasProductPromo,
} from "@/data/tipos";
export function PromoBanner({
  product,
  onCta,
  onImageError,
}: {
  product: Product | null;
  onCta: () => void;
  onImageError?: () => void;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!product?.image || failed === product.image) return null;
  const discount = productDiscountPercent(product);
  return (
    <section className="offer-spotlight" aria-label="Oferta em destaque">
      <button type="button" onClick={onCta} className="offer-spotlight-link">
        <div className="offer-spotlight-copy">
          <span className="offer-spotlight-label">
            {product.comboId != null
              ? "Combo em destaque"
              : "Oferta em destaque"}
          </span>
          <h2>{product.name}</h2>
          <p>
            {discount > 0
              ? `Economize ${formatBRL(product.price - getProductUnitPrice(product))}`
              : product.freteGratis
                ? "Frete grátis neste produto"
                : "Confira esta oferta"}
          </p>
          <div className="offer-spotlight-price">
            {hasProductPromo(product) && <del>{formatBRL(product.price)}</del>}
            <strong>{formatBRL(getProductUnitPrice(product))}</strong>
          </div>
          <span className="offer-spotlight-cta">Ver oferta</span>
        </div>
        <div className="offer-spotlight-photo">
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(max-width:767px) 130px, 200px"
            className="object-cover"
            onError={() => { setFailed(product.image ?? null); onImageError?.(); }}
          />
        </div>
      </button>
    </section>
  );
}
