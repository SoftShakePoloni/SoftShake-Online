"use client";

import { Search, Plus, Upload, Download } from "lucide-react";

export function CatalogoHeader({
  search,
  onSearchChange,
  onNovoProduto,
  onImport,
  onExport,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onNovoProduto: () => void;
  onImport?: () => void;
  onExport?: () => void;
}) {
  return (
    <header className="shrink-0 border-b border-[#E5E7EB] bg-white px-3 sm:px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, categoria, código…"
            aria-label="Buscar produtos"
            className="w-full h-9 pl-8 pr-3 rounded-md border border-[#E5E7EB] bg-white text-[13px] text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:ring-1 focus:ring-[#4C258C]/40 focus:border-[#4C258C]"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={onImport}
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar
          </button>
          <button
            type="button"
            onClick={onExport}
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button
            type="button"
            onClick={onNovoProduto}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#111827] px-3 text-[12px] font-medium text-white hover:bg-black"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo produto
          </button>
        </div>
      </div>
    </header>
  );
}
