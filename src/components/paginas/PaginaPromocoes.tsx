"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Search, Gift, Sparkles } from "lucide-react";
import { useMenu } from "@/hooks/useCardapio";
import {
  productDiscountPercent,
  type Product,
} from "@/data/tipos";
import { cn } from "@/lib/utils";
import { PromoBanner } from "@/components/cardapio/promocoes/PromoBanner";
import { PromoProductCard } from "@/components/cardapio/promocoes/PromoProductCard";
import {
  isComboProduct,
  listPromoProducts,
  promoCategoriesOnly,
} from "@/components/cardapio/promocoes/promo-utils";
import { ProductDetailDialog } from "@/components/cardapio/ModalProduto";

export default function PaginaPromocoes() {
  const { categories, isLoading, error } = useMenu();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("todos");
  const [bannerProduct, setBannerProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const allPromos = useMemo(
    () => listPromoProducts(categories),
    [categories]
  );

  const promoCats = useMemo(
    () => promoCategoriesOnly(categories),
    [categories]
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
      const hay = [p.name, p.description, catName, p.tag?.nome ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allPromos, categoryId, promoCats, query, categories]);

  const featured = useMemo(() => {
    return [...filtered]
      .sort(
        (a, b) => productDiscountPercent(b) - productDiscountPercent(a)
      )
      .slice(0, 8);
  }, [filtered]);

  const combos = useMemo(
    () => filtered.filter(isComboProduct),
    [filtered]
  );

  const byCategory = useMemo(() => {
    if (categoryId !== "todos" || query.trim()) return [];
    return promoCats.filter((c) => c.products.length > 0);
  }, [promoCats, categoryId, query]);

  // Banner: maior desconto
  useEffect(() => {
    if (allPromos.length === 0) {
      setBannerProduct(null);
      return;
    }
    const best = [...allPromos].sort(
      (a, b) => productDiscountPercent(b) - productDiscountPercent(a)
    )[0];
    setBannerProduct(best ?? null);
  }, [allPromos]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAFB]">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 lg:px-6">
        {/* Header */}
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-[28px]">
            Promoções
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Economize nas melhores ofertas da SoftShake.
          </p>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar promoção, sabor ou categoria"
              className={cn(
                "h-11 w-full rounded-xl border border-[#E8E8EA] bg-white pl-10 pr-4 text-sm text-[#111827]",
                "placeholder:text-[#9CA3AF] outline-none transition-shadow duration-150",
                "focus:border-[#4C258C]/40 focus:ring-2 focus:ring-[#4C258C]/15"
              )}
              aria-label="Buscar promoção"
            />
          </div>
        </header>

        {/* Categorias */}
        {!isLoading && allPromos.length > 0 && (
          <div className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2 pb-0.5">
              {chips.map((chip) => {
                const active = categoryId === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setCategoryId(chip.id)}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-[#4C258C] text-white"
                        : "bg-white text-[#374151] border border-[#E8E8EA] hover:border-[#D4C4F0] hover:text-[#4C258C]"
                    )}
                  >
                    {chip.name}
                    <span
                      className={cn(
                        "tabular-nums text-[11px]",
                        active ? "text-white/80" : "text-[#9CA3AF]"
                      )}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-[#EEE]" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-72 w-[280px] shrink-0 animate-pulse rounded-2xl bg-[#EEE]"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl bg-[#EEE]"
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível carregar as promoções. Tente novamente.
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && allPromos.length === 0 && <EmptyState />}

        {!isLoading && !error && allPromos.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-[#E8E8EA] bg-white px-6 py-12 text-center">
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
              className="mt-4 text-sm font-semibold text-[#4C258C] hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="space-y-9">
            {/* Banner */}
            {categoryId === "todos" && !query.trim() && bannerProduct && (
              <PromoBanner
                product={bannerProduct}
                onCta={() => {
                  setDetailProduct(bannerProduct);
                  setDetailOpen(true);
                }}
              />
            )}

            {/* Destaque carrossel */}
            {featured.length > 0 && (
              <section>
                <SectionTitle
                  title="Ofertas em destaque"
                  subtitle="As melhores condições do momento"
                />
                <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {featured.map((p) => (
                    <PromoProductCard
                      key={p.id}
                      product={p}
                      variant="featured"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Combos */}
            {combos.length > 0 && categoryId === "todos" && !query.trim() && (
              <section>
                <SectionTitle
                  title="Combos especiais"
                  subtitle="Mais sabor, mais economia"
                />
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {combos.map((p) => (
                    <PromoProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Todas / por categoria */}
            {byCategory.length > 0 ? (
              byCategory.map((cat) => (
                <section key={cat.id}>
                  <SectionTitle title={`Promoções de ${cat.name}`} />
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cat.products.map((p) => (
                      <PromoProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <section>
                <SectionTitle
                  title={
                    categoryId === "todos"
                      ? "Todas as promoções"
                      : chips.find((c) => c.id === categoryId)?.name ??
                        "Promoções"
                  }
                  subtitle={
                    query.trim()
                      ? `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`
                      : undefined
                  }
                />
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((p) => (
                    <PromoProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <ProductDetailDialog
          product={detailProduct}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight text-[#111827] sm:text-xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-[#6B7280]">{subtitle}</p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#E8E8EA] bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EEFA] text-[#4C258C]">
        <Gift className="h-7 w-7" />
      </div>
      <h2 className="text-base font-semibold text-[#111827]">
        Nenhuma promoção disponível no momento
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6B7280]">
        Em breve teremos novas ofertas para você. Enquanto isso, confira o
        cardápio completo.
      </p>
      <a
        href="/"
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4C258C] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#5E35B1]"
      >
        <Sparkles className="h-4 w-4" />
        Ver cardápio
      </a>
    </div>
  );
}
