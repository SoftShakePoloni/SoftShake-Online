"use client";
import { Plus, MoreHorizontal, Upload, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { CatalogTab } from "./types";
export function CatalogoHeader({
  activeTab,
  onNovoProduto,
  onImport,
  onExport,
}: {
  activeTab: CatalogTab;
  onNovoProduto: () => void;
  onImport?: () => void;
  onExport?: () => void;
}) {
  const copy: Record<CatalogTab, { title: string; description: string }> = {
    produtos: { title: "Produtos", description: "Gerencie seu catálogo" },
    complementos: {
      title: "Complementos",
      description: "Organize os extras do seu cardápio",
    },
    opcoes: {
      title: "Opções",
      description: "Gerencie sabores, tamanhos e escolhas",
    },
    combos: { title: "Combos", description: "Combine produtos em uma oferta" },
    promocoes: { title: "Promoções", description: "Gerencie suas campanhas" },
  };
  return (
    <header className="catalog-heading">
      <div>
        <h1>{copy[activeTab].title}</h1>
        <p>{copy[activeTab].description}</p>
      </div>
      {activeTab === "produtos" && (
        <div className="catalog-heading-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="catalog-secondary-action"
                aria-label="Mais ações do catálogo"
              >
                <MoreHorizontal size={19} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onImport}>
                <Upload size={15} aria-hidden="true" className="mr-2" />
                Importar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                <Download size={15} aria-hidden="true" className="mr-2" />
                Exportar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={onNovoProduto}
            className="catalog-primary-action"
          >
            <Plus size={16} aria-hidden="true" />
            Novo produto
          </button>
        </div>
      )}
    </header>
  );
}
