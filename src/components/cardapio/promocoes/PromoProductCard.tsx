"use client";

import { useState } from "react";
import { useModalHistory } from "@/hooks/useModalHistory";
import { StorageImage as Image } from "@/components/ui/storage-image";
import { Gift, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/tipos";
import {
  formatBRL,
  getProductUnitPrice,
  hasProductPromo,
  productDiscountPercent,
} from "@/data/tipos";
import { useCarrinho } from "@/context/CarrinhoContext";
import { useLoja } from "@/hooks/useLoja";
import { ProductDetailDialog } from "@/components/cardapio/ModalProduto";
import { cn } from "@/lib/utils";

import { productNeedsOptions } from "./promo-utils";

type Variant = "grid" | "featured";

export function PromoProductCard({
  product,
  variant = "grid",
}: {
  product: Product;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(false);
  useModalHistory(open, setOpen);
  const [bump, setBump] = useState(false);
  const { adicionarItem } = useCarrinho();
  const { loja, isLoading } = useLoja();
  const lojaAberta = isLoading ? true : Boolean(loja?.esta_aberto);
  const disponivel = product.disponivel !== false;
  const unit = getProductUnitPrice(product);
  const optionsNotLoaded =
    product.comboId == null &&
    /^\d+$/.test(product.id) &&
    !(product.optionGroups ?? []).some((group) => group.id !== "obs");
  const needsOptions = productNeedsOptions(product) || optionsNotLoaded;
  const discount = productDiscountPercent(product);
  const [failedImage, setFailedImage] = useState<string | null>(null);
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
        className={cn(
          "offer-card",
          featured && "offer-card-featured",
          !disponivel && "offer-card-unavailable",
          bump && "offer-card-added",
        )}
      >
        <button
          type="button"
          onClick={openProduct}
          disabled={!disponivel}
          aria-label={`Ver detalhes de ${product.name}`}
          className="offer-photo"
        >
          {product.image && failedImage !== product.image ? (
            <Image
              preset="offer"
              src={product.image}
              alt=""
              width={1200}
              height={1200}
              sizes="(max-width: 359px) 88px, 108px"
              quality={90}
              className="h-auto w-full object-contain"
              onError={() => setFailedImage(product.image ?? null)}
            />
          ) : (
            <Gift size={26} aria-hidden="true" />
          )}
        </button>
        <div className="offer-info">
          <h2>
            <button type="button" onClick={openProduct} disabled={!disponivel}>
              {product.name}
            </button>
          </h2>
          {product.description && (
            <p className="offer-description">{product.description}</p>
          )}
          <div className="offer-purchase">
            <div className="offer-prices">
              <strong>{formatBRL(unit)}</strong>
              {hasProductPromo(product) && (
                <del>{formatBRL(product.price)}</del>
              )}
              {discount > 0 ? (
                <span className="offer-benefit">{discount}% OFF</span>
              ) : product.freteGratis ? (
                <span className="offer-benefit">Frete grátis</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handlePrimary}
              disabled={!disponivel}
              className="offer-add"
              title={
                needsOptions
                  ? `Escolher opções de ${product.name}`
                  : `Adicionar ${product.name}`
              }
              aria-label={
                needsOptions
                  ? `Escolher opções de ${product.name}`
                  : `Adicionar ${product.name} à sacola`
              }
            >
              <Plus size={19} aria-hidden="true" />
            </button>
          </div>
          {product.freteGratis && product.freteGratisPrazo && (
            <p className="offer-validity">{product.freteGratisPrazo}</p>
          )}
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
