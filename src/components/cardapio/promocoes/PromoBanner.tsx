"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/data/tipos";
import { productDiscountPercent } from "@/data/tipos";

export function PromoBanner({
  product,
  onCta,
}: {
  product: Product | null;
  onCta: () => void;
}) {
  if (!product) return null;

  const pct = productDiscountPercent(product);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#4C258C]">
      <div className="grid min-h-[160px] sm:min-h-[180px] md:min-h-[200px] grid-cols-1 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
            Oferta em destaque
          </p>
          <h2 className="mt-1.5 text-xl font-bold leading-tight text-white sm:text-2xl md:text-[28px]">
            {product.name}
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/80 line-clamp-2">
            {product.description ||
              "Aproveite condições especiais por tempo limitado."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {pct > 0 && (
              <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#4C258C]">
                Até {pct}% OFF
              </span>
            )}
            <button
              type="button"
              onClick={onCta}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#4C258C] transition-colors duration-150 hover:bg-[#F3EEFA]"
            >
              Aproveitar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative hidden min-h-[160px] sm:block">
          {product.image ? (
            <>
              <Image
                src={product.image}
                alt=""
                fill
                className="object-cover"
                sizes="40vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#4C258C] via-[#4C258C]/40 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#5E35B1]/40" />
          )}
        </div>
      </div>
    </section>
  );
}
