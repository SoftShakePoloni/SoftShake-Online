"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StoreHero } from "@/components/cardapio/HeroLoja";
import { CategoryBar } from "@/components/cardapio/BarraCategorias";
import { FeaturedCarousel } from "@/components/cardapio/CarrosselDestaques";
import { ProductSection } from "@/components/cardapio/SecaoProdutos";
import { useMenu } from "@/hooks/useCardapio";
import { getFeaturedProducts, hasProductPromo, type Category } from "@/data/tipos";

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
  const searchRef = useRef(searchQuery);
  searchRef.current = searchQuery;
  useEffect(() => {
    const restore = () => {
      setSelectedCategoryId(new URL(location.href).searchParams.get("categoria"));
      setSearchQuery(history.state?.softshakeMenu?.search ?? "");
      const y = history.state?.softshakeMenu?.scrollY;
      if (typeof y === "number") requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    history.replaceState({ ...history.state, softshakeMenu: { ...history.state?.softshakeMenu, search: searchQuery } }, "", location.href);
  }, [searchQuery]);

  const orderedCategories = useMemo(() => {
    const products = categories.flatMap(category => category.products);
    const combos = products.filter(product => product.disponivel !== false &&
      (product.comboId != null || normalize(product.name).includes("combo do dia")));
    const comboIds = new Set(combos.map(product => product.id));
    const promotions = products.filter(product => product.disponivel !== false &&
      !comboIds.has(product.id) && (hasProductPromo(product) || product.freteGratis));
    const highlightedIds = new Set([...combos, ...promotions].map(product => product.id));
    const remaining = categories.map(category => ({ ...category,
      products: category.products.filter(product => !highlightedIds.has(product.id)),
    })).filter(category => category.products.length > 0);
    return [
      ...(combos.length ? [{ id: "ofertas-combos", name: "Combo do dia", products: combos }] : []),
      ...(promotions.length ? [{ id: "ofertas-promocoes", name: "Promoções", products: promotions }] : []),
      ...remaining,
    ];
  }, [categories]);

  const featuredProducts = useMemo(
    () => getFeaturedProducts(orderedCategories.filter(category => !category.id.startsWith("ofertas-"))),
    [orderedCategories]
  );

  const filteredCategories = useMemo(
    () => filterCategories(orderedCategories, selectedCategoryId, searchQuery),
    [orderedCategories, selectedCategoryId, searchQuery]
  );

  const isFiltering = Boolean(selectedCategoryId || searchQuery.trim());

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    const url = new URL(location.href);
    const current = url.searchParams.get("categoria");
    if (current !== categoryId) {
      history.replaceState({ ...history.state, softshakeMenu: { search: searchRef.current, scrollY: window.scrollY } }, "", location.href);
      if (categoryId) url.searchParams.set("categoria", categoryId);
      else url.searchParams.delete("categoria");
      history.pushState({ ...history.state, softshakeMenu: { search: searchRef.current, scrollY: 0 } }, "", url);
    }
    setSelectedCategoryId(categoryId);

    if (!categoryId) {
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
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
        <h1 className="sr-only">SoftShake — Cardápio</h1>
        <StoreHero />
        <CategoryBar
          categories={orderedCategories}
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
          <>
            {filteredCategories.filter(category => category.id.startsWith("ofertas-")).map(category => <ProductSection key={category.id} category={category} />)}
            <FeaturedCarousel products={featuredProducts} />
          </>
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
        {filteredCategories.filter(category => isFiltering || featuredProducts.length === 0 || !category.id.startsWith("ofertas-")).map((c) => (
          <ProductSection key={c.id} category={c} />
        ))}
      </main>
    </div>
  );
}
