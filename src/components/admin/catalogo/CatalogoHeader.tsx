"use client";
import { Plus, MoreHorizontal, Upload, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { CatalogTab } from "./types";

const COPY: Record<CatalogTab, { title: string; description: string }> = {
  produtos: {
    title: "Produtos",
    description: "Preços, fotos e disponibilidade de tudo o que aparece no cardápio.",
  },
  complementos: {
    title: "Complementos",
    description: "Extras pagos ou gratuitos que o cliente adiciona ao pedido.",
  },
  opcoes: {
    title: "Opções",
    description: "Sabores, tamanhos e escolhas obrigatórias de cada produto.",
  },
  combos: { title: "Combos", description: "Junte produtos em uma oferta com preço especial." },
  promocoes: { title: "Promoções", description: "Campanhas de frete grátis e descontos." },
};

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
  return (
    <header className="catalog-heading">
      <div className="catalog-heading-text">
        <p className="catalog-eyebrow">Cardápio</p>
        <h1>{COPY[activeTab].title}</h1>
        <p className="catalog-heading-description">{COPY[activeTab].description}</p>
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
                <MoreHorizontal size={18} aria-hidden="true" />
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
          <button type="button" onClick={onNovoProduto} className="catalog-primary-action">
            <Plus size={16} aria-hidden="true" />
            Novo produto
            <kbd className="catalog-kbd is-inverse" aria-hidden="true">N</kbd>
          </button>
        </div>
      )}
    </header>
  );
}
