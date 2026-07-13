"use client";

import { useCallback, useMemo, useState } from "react";
import { StoreHero } from "@/components/cardapio/HeroLoja";
import { CategoryBar } from "@/components/cardapio/BarraCategorias";
import { FeaturedCarousel } from "@/components/cardapio/CarrosselDestaques";
import { ProductSection } from "@/components/cardapio/SecaoProdutos";
import { getFeaturedProducts } from "@/data/cardapio";
import { useMenu } from "@/hooks/useCardapio";
import type { Category } from "@/data/tipos";

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function filterCategories(
  categories: Category[],
  selectedCategoryId: string | null,
  searchQuery: string
): Category[] {
  const query = normalize(searchQuery);

  return categories
    .filter((c) => !selectedCategoryId || c.id === selectedCategoryId)
    .map((c) => {
      if (!query) return c;
      const products = c.products.filter(
        (p) =>
          normalize(p.name).includes(query) ||
          normalize(p.description ?? "").includes(query)
      );
      return { ...c, products };
    })
    .filter((c) => c.products.length > 0);
}

export default function PaginaInicio() {
  const { categories, isLoading, error, live } = useMenu();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const featuredProducts = useMemo(
    () => getFeaturedProducts(categories),
    [categories]
  );

  const filteredCategories = useMemo(
    () => filterCategories(categories, selectedCategoryId, searchQuery),
    [categories, selectedCategoryId, searchQuery]
  );

  const isFiltering = Boolean(selectedCategoryId || searchQuery.trim());

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);

    if (!categoryId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Aguarda o re-render (filtro) antes de rolar até a seção
    window.setTimeout(() => {
      document
        .getElementById(`categoria-${categoryId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <main className="space-y-8">
        <StoreHero />
        <CategoryBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          searchQuery={searchQuery}
          onSelectCategory={handleSelectCategory}
          onSearchChange={setSearchQuery}
        />
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
        {/* Indicador discreto de sincronização ao vivo */}
        {live && !isLoading && !error && (
          <p className="sr-only" aria-live="polite">
            Cardápio sincronizado em tempo real
          </p>
        )}
        {!isFiltering && featuredProducts.length > 0 && (
          <FeaturedCarousel products={featuredProducts} />
        )}
        {!isLoading &&
          !error &&
          categories.length > 0 &&
          filteredCategories.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `Nenhum produto encontrado para “${searchQuery.trim()}”.`
                : "Nenhum produto nesta categoria."}
            </div>
          )}
        {filteredCategories.map((c) => (
          <ProductSection key={c.id} category={c} />
        ))}
      </main>
    </div>
  );
}
