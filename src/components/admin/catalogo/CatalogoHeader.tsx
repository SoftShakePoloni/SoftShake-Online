"use client";

import {
  Search,
  Plus,
  Upload,
  Download,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <header className="h-16 shrink-0 border-b border-[#E5E7EB] bg-white px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#111827] tracking-tight">
          Catálogo
        </h1>
        <p className="text-xs text-[#9CA3AF] hidden sm:block">
          Produtos, categorias e complementos
        </p>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-2xl justify-end">
        <div className="relative flex-1 max-w-xs hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar produtos…"
            className="pl-9 h-9 rounded-xl border-[#E5E7EB] bg-[#F7F8FC] focus-visible:ring-[#4C258C]/30"
            aria-label="Buscar produtos"
          />
        </div>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-[#E5E7EB] hidden sm:inline-flex"
                onClick={onImport}
              >
                <Upload className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden lg:inline">Importar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar produtos (em breve)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-[#E5E7EB] hidden sm:inline-flex"
                onClick={onExport}
              >
                <Download className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden lg:inline">Exportar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar catálogo (JSON)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-[#9CA3AF] px-2">
                <Keyboard className="w-3 h-3" /> N · /
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Atalhos: N novo produto · / focar busca · Esc fechar
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          type="button"
          size="sm"
          onClick={onNovoProduto}
          className="h-9 rounded-xl bg-[#4C258C] hover:bg-[#5E35B1] text-white font-semibold shadow-sm shadow-[#4C258C]/25"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Produto
        </Button>
      </div>
    </header>
  );
}
