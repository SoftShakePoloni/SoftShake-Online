"use client";

import { ChevronRight } from "lucide-react";
import {useRef} from "react";
import type { Product } from "@/data/tipos";
import { ProductCard } from "./CardProduto";

export function FeaturedCarousel({ products }: { products: Product[] }) {
  const scrollRef=useRef<HTMLDivElement>(null);
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-foreground sm:text-2xl">Destaques</h2>
      <div className="relative">
        <div ref={scrollRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((p) => (
            <div key={p.id} className="w-72 shrink-0 snap-start sm:w-80">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={()=>scrollRef.current?.scrollBy({left:scrollRef.current.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
          aria-label="Próximos destaques"
          className="absolute -right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md md:flex"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
