"use client";
import "@/components/cardapio/promocoes/offers.css";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMenu } from "@/hooks/useCardapio";
import { cn } from "@/lib/utils";
import { PromoProductCard } from "@/components/cardapio/promocoes/PromoProductCard";
import {
  listPromoProducts,
  promoCategoriesOnly,
} from "@/components/cardapio/promocoes/promo-utils";

export default function PaginaPromocoes() {
  const { categories, isLoading, error } = useMenu();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("todos");
  const [searchOpen, setSearchOpen] = useState(false);

  const allPromos = useMemo(() => listPromoProducts(categories), [categories]);

  const promoCats = useMemo(
    () => promoCategoriesOnly(categories),
    [categories],
  );

  const chips = useMemo(() => {
    return [
      { id: "todos", name: "Todos", count: allPromos.length },
      ...promoCats.map((c) => ({
        id: c.id,
        name: c.name,
        count: c.products.length,
      })),
    ];
  }, [allPromos.length, promoCats]);

  const filtered = useMemo(() => {
    let list = allPromos;
    if (categoryId !== "todos") {
      const cat = promoCats.find((c) => c.id === categoryId);
      list = cat?.products ?? [];
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const catName =
        categories.find((c) => c.products.some((x) => x.id === p.id))?.name ??
        "";
      const hay = [
        p.name,
        p.description,
        catName,
        p.tag?.nome ?? "",
        p.freteGratis ? "frete grátis frete gratis" : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allPromos, categoryId, promoCats, query, categories]);

  const clearFilters = () => {
    setQuery("");
    setCategoryId("todos");
  };
  return (
    <main
      id="conteudo-principal"
      className="offers-page min-h-[calc(100dvh-4rem)] bg-background text-foreground"
    >
      <div className="offers-container">
        <header className="offers-heading">
          <h1>Promoções</h1>
          <button
            type="button"
            className="offers-search-toggle"
            aria-expanded={searchOpen}
            aria-controls="offers-search-field"
            aria-label={
              searchOpen ? "Fechar busca e limpar pesquisa" : "Buscar promoções"
            }
            title={searchOpen ? "Fechar busca" : "Buscar promoções"}
            onClick={() => {
              if (searchOpen) setQuery("");
              setSearchOpen(!searchOpen);
            }}
          >
            {searchOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Search size={20} aria-hidden="true" />
            )}
          </button>
        </header>
        {searchOpen && (
          <div className="offers-search" id="offers-search-field">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ofertas"
              aria-label="Buscar promoção"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
              >
                Limpar
              </button>
            )}
          </div>
        )}
        {!isLoading && allPromos.length > 0 && (
          <nav className="offers-chips" aria-label="Categorias de promoções">
            <div>
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={categoryId === chip.id}
                  onClick={() => setCategoryId(chip.id)}
                  className={cn(categoryId === chip.id && "is-active")}
                >
                  {chip.name}
                </button>
              ))}
            </div>
          </nav>
        )}
        {isLoading && (
          <div
            className="offers-grid"
            role="status"
            aria-label="Carregando promoções"
          >
            {[1, 2, 3, 4].map((id) => (
              <div
                key={id}
                className="h-40 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
              />
            ))}
          </div>
        )}
        {error && (
          <div role="alert" className="offers-empty">
            <p>Não foi possível carregar as promoções.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Tentar novamente
            </button>
          </div>
        )}
        {!isLoading && !error && !allPromos.length && (
          <div className="offers-empty">
            <p>Nenhuma promoção disponível no momento.</p>
            <Link href="/">Ver cardápio</Link>
          </div>
        )}
        {!isLoading && !error && allPromos.length > 0 && !filtered.length && (
          <div className="offers-empty">
            <p>Não encontramos ofertas para sua busca.</p>
            <button type="button" onClick={clearFilters}>
              Ver todas as promoções
            </button>
          </div>
        )}
        {!isLoading && !error && filtered.length > 0 && (
          <section aria-label="Promoções disponíveis">
            {(query.trim() || categoryId !== "todos") && (
              <p className="offers-results" role="status">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "oferta encontrada"
                  : "ofertas encontradas"}
              </p>
            )}
            <div className="offers-grid">
              {filtered.map((product) => (
                <PromoProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
