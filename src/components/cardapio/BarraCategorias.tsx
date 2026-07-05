import type { Category } from "@/data/tipos";
import { ChevronDown, Search } from "lucide-react";

export function CategoryBar({ categories }: { categories: Category[] }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button className="inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted sm:w-64">
        {categories.length ? `${categories.length} categorias` : "Lista de categorias"}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Busque por um produto"
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        />
      </div>
    </div>
  );
}
