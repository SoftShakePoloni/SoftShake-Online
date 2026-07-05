"use client";

import { useMemo } from "react";
import { StoreHero } from "@/components/cardapio/HeroLoja";
import { CategoryBar } from "@/components/cardapio/BarraCategorias";
import { FeaturedCarousel } from "@/components/cardapio/CarrosselDestaques";
import { ProductSection } from "@/components/cardapio/SecaoProdutos";
import { getFeaturedProducts } from "@/data/cardapio";
import { useMenu } from "@/hooks/useCardapio";

export default function PaginaInicio() {
  const { categories, isLoading, error } = useMenu();
  const featuredProducts = useMemo(() => getFeaturedProducts(categories), [categories]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <main className="space-y-8">
        <StoreHero />
        <CategoryBar categories={categories} />
        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Carregando cardápio...
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            Erro ao carregar cardápio: {error}
          </div>
        )}
        {!isLoading && !error && categories.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum produto disponível no cardápio.
          </div>
        )}
        {featuredProducts.length > 0 && <FeaturedCarousel products={featuredProducts} />}
        {categories.map((c) => (
          <ProductSection key={c.id} category={c} />
        ))}
      </main>
    </div>
  );
}
