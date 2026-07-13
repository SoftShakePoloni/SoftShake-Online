"use client";

import type { Category } from "@/data/tipos";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const label = selectedCategory
    ? selectedCategory.name
    : categories.length
      ? "Todas as categorias"
      : "Lista de categorias";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-64"
            aria-label="Selecionar categoria"
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-72">
          <DropdownMenuLabel>Categorias</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onSelectCategory(null)}
            className="cursor-pointer justify-between"
          >
            <span>Todas as categorias</span>
            {!selectedCategoryId && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="cursor-pointer justify-between"
            >
              <span className="truncate">{category.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {category.products.length}
                </span>
                {selectedCategoryId === category.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </span>
            </DropdownMenuItem>
          ))}
          {categories.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              Nenhuma categoria disponível
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Busque por um produto"
          className={cn(
            "w-full rounded-lg border border-border bg-card py-2.5 pl-10 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40",
            searchQuery ? "pr-10" : "pr-4"
          )}
          aria-label="Buscar produtos"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
