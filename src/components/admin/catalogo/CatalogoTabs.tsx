"use client";

import { cn } from "@/lib/utils";
import type { CatalogTab } from "./types";

const TABS: { id: CatalogTab; label: string }[] = [
  { id: "produtos", label: "Produtos" },
  { id: "complementos", label: "Complementos" },
  { id: "opcoes", label: "Opções" },
  { id: "combos", label: "Combos" },
  { id: "promocoes", label: "Promoções" },
];

export function CatalogoTabs({
  active,
  onChange,
}: {
  active: CatalogTab;
  onChange: (tab: CatalogTab) => void;
}) {
  return (
    <div className="shrink-0 bg-[#F7F8FC] px-4 sm:px-6">
      <nav className="flex gap-6 overflow-x-auto border-b border-[#E5E2E8]" role="tablist">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative -mb-px whitespace-nowrap border-b-2 px-1 py-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4C258C]/30",
                isActive
                  ? "border-[#4C258C] text-[#3F1E76]"
                  : "border-transparent text-[#77727E] hover:text-[#27232D]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
