"use client";

import type { Category } from "@/data/tipos";
import { ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryBarProps = {
  categories: Category[];
  selectedCategoryId: string | null;
  searchQuery: string;
  onSelectCategory: (categoryId: string | null) => void;
  onSearchChange: (query: string) => void;
};

export function CategoryBar({
  categories,
  selectedCategoryId,
  searchQuery,
  onSelectCategory,
  onSearchChange,
}: CategoryBarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B3FA0]"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Pesquisar…"
          aria-label="Pesquisar produtos"
          className={cn(
            "h-11 w-full rounded-full border border-[#E7E1EB] bg-white pl-10 text-sm text-[#21172D] shadow-sm shadow-[#271834]/[0.03] outline-none placeholder:text-[#94899E] focus-visible:border-[#BBA7D2] focus-visible:ring-2 focus-visible:ring-[#6B3FA0]/20",
            searchQuery ? "pr-11" : "pr-4",
          )}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7B668C] transition-colors hover:bg-[#F1EAF8] hover:text-[#432078] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B3FA0]"
            aria-label="Limpar pesquisa"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      <section aria-labelledby="titulo-categorias">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2
            id="titulo-categorias"
            className="text-sm font-semibold text-[#21172D]"
          >
            Categorias
          </h2>
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            aria-label="Ver todas as categorias"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md text-xs font-medium text-[#6B3FA0] hover:text-[#432078] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B3FA0]"
          >
            Ver todas
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>

        {categories.length > 0 ? (
          <div
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filtrar por categoria"
          >
            {categories.map((category) => {
              const selected = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  aria-pressed={selected}
                  className={cn(
                    "max-w-[70vw] shrink-0 truncate rounded-full px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B3FA0] focus-visible:ring-offset-2",
                    selected
                      ? "bg-[#432078] text-white"
                      : "bg-[#F1EFF3] text-[#51485A] hover:bg-[#E9E2F0] hover:text-[#432078]",
                  )}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#7B668C]">
            Nenhuma categoria disponível.
          </p>
        )}
      </section>
    </div>
  );
}
