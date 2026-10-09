"use client";

import { Search, Plus, Upload, Download } from "lucide-react";
import type { CatalogTab } from "./types";

export function CatalogoHeader({
  activeTab,
  search,
  onSearchChange,
  onNovoProduto,
  onImport,
  onExport,
}: {
  activeTab: CatalogTab;
  search: string;
  onSearchChange: (v: string) => void;
  onNovoProduto: () => void;
  onImport?: () => void;
  onExport?: () => void;
}) {
  const copy: Record<CatalogTab, { eyebrow: string; title: string; description: string }> = {
    produtos: { eyebrow: "CATÁLOGO DA LOJA", title: "Produtos", description: "Organize produtos, preços e disponibilidade." },
    complementos: { eyebrow: "CATÁLOGO DA LOJA", title: "Complementos", description: "Agrupe escolhas extras para os produtos do cardápio." },
    opcoes: { eyebrow: "CATÁLOGO DA LOJA", title: "Opções", description: "Gerencie sabores, tamanhos e outras escolhas." },
    combos: { eyebrow: "CATÁLOGO DA LOJA", title: "Combos", description: "Monte ofertas com vários produtos." },
    promocoes: { eyebrow: "CATÁLOGO DA LOJA", title: "Promoções", description: "Configure campanhas e condições especiais." },
  };
  const current = copy[activeTab];

  return (
    <header className="shrink-0 bg-[#F7F8FC] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7C6A99]">{current.eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-[#17151B]">{current.title}</h2>
          <p className="mt-1 text-[13px] text-[#6F6B76]">{current.description}</p>
        </div>

        {activeTab === "produtos" && <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onImport}
            className="hidden h-9 items-center gap-2 rounded-lg border border-[#E4E1E8] bg-white px-3 text-[13px] font-medium text-[#514B59] transition-colors hover:bg-[#FAF9FB] sm:inline-flex"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <button
            type="button"
            onClick={onExport}
            className="hidden h-9 items-center gap-2 rounded-lg border border-[#E4E1E8] bg-white px-3 text-[13px] font-medium text-[#514B59] transition-colors hover:bg-[#FAF9FB] sm:inline-flex"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            type="button"
            onClick={onNovoProduto}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#4C258C] px-3.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#3F1E76] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/35 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </button>
        </div>}
      </div>

      {activeTab === "produtos" && <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] max-w-lg flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#918B98]" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, categoria, código…"
            aria-label="Buscar produtos"
            className="h-10 w-full rounded-lg border border-[#E4E1E8] bg-white pl-9 pr-3 text-[13px] text-[#211E26] shadow-sm outline-none transition focus:border-[#9B82C1] focus:ring-2 focus:ring-[#4C258C]/10 placeholder:text-[#9A95A0]"
          />
        </div>
      </div>}
    </header>
  );
}
