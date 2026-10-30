"use client";
import "@/components/cardapio/promocoes/offers.css";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
  const searchRef = useRef<HTMLInputElement>(null);

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

  const gridProducts = filtered;

  return (
    <>
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-[#432078] focus:shadow-lg"
      >
        Pular para o conteúdo principal
      </a>
      <main
        id="conteudo-principal"
        className="offers-page min-h-[calc(100dvh-4rem)] bg-[#FAF9FC] text-[#21172D]"
      >
        <div className="offers-container">
          {/* Header */}
          <header className="offers-heading">
            <h1 className="text-2xl font-bold tracking-[-0.035em] text-[#21172D] sm:text-4xl">
              Promoções
            </h1>
            <p className="mt-1 text-sm leading-6 text-[#6F6479] sm:text-base">
              Ofertas especiais para você
            </p>

            <div className="relative mt-4 max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ofertas"
                className={cn(
                  "h-11 w-full rounded-lg border border-[#E5DFEA] bg-white pl-10 pr-4 text-sm text-[#21172D]",
                  "placeholder:text-[#978DA0] outline-none transition-shadow duration-150",
                  "focus-visible:border-[#6B3FA0] focus-visible:ring-2 focus-visible:ring-[#6B3FA0]/20",
                )}
                aria-label="Buscar promoção"
              />
            </div>
          </header>

          {/* Categorias */}
          {!isLoading && allPromos.length > 0 && (
            <div className="offers-chips -mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2 pb-0.5">
                {chips.map((chip) => {
                  const active = categoryId === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setCategoryId(chip.id)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B3FA0]",
                        active
                          ? "bg-[#432078] text-white"
                          : "border border-[#E5DFEA] bg-white text-[#51465B] hover:border-[#BBA7D2] hover:text-[#432078]",
                      )}
                    >
                      {chip.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-lg bg-[#EEE9F1] motion-reduce:animate-none" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse rounded-lg bg-[#EEE9F1] motion-reduce:animate-none"
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              Não foi possível carregar as promoções. Atualize a página para
              tentar novamente.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && allPromos.length === 0 && <EmptyState />}

          {!isLoading &&
            !error &&
            allPromos.length > 0 &&
            filtered.length === 0 && (
              <div className="rounded-2xl border border-[#E5DFEA] bg-white px-6 py-12 text-center">
                <p className="text-sm font-medium text-[#111827]">
                  Nenhuma promoção encontrada
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Tente outro termo ou categoria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategoryId("todos");
                  }}
                  className="mt-4 rounded-sm text-sm font-semibold text-[#432078] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B3FA0]"
                >
                  Limpar filtros
                </button>
              </div>
            )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="space-y-5">
              <section aria-labelledby="lista-promocoes">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2
                      id="lista-promocoes"
                      className="text-base font-semibold tracking-tight text-[#21172D] sm:text-2xl"
                    >
                      {categoryId === "todos"
                        ? "Ofertas disponíveis"
                        : (chips.find((c) => c.id === categoryId)?.name ??
                          "Promoções")}
                    </h2>
                    <p className="mt-1 text-sm text-[#6F6479]">
                      {filtered.length}{" "}
                      {filtered.length === 1
                        ? "oferta disponível"
                        : "ofertas disponíveis"}
                    </p>
                  </div>
                </div>
                {gridProducts.length > 0 ? (
                  <div className="offers-grid">
                    {gridProducts.map((p) => (
                      <PromoProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-[#E5DFEA] bg-white p-5 text-sm text-[#6F6479]">
                    Confira os detalhes da oferta para pedir.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#E5DFEA] bg-white px-6 py-9 text-center">
      <h2 className="text-base font-semibold text-[#21172D]">
        Nenhuma promoção disponível no momento
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6F6479]">
        Em breve teremos novas ofertas para você. Enquanto isso, confira o
        cardápio completo.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#432078] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#56308D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B3FA0] focus-visible:ring-offset-2"
      >
        Ver cardápio
      </Link>
    </div>
  );
}
