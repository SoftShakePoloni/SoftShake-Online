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
    <div className="border-b border-[#E5E7EB] bg-white px-3 sm:px-4">
      <nav className="flex gap-0 overflow-x-auto" role="tablist">
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
                "relative px-3 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-[#111827] text-[#111827]"
                  : "border-transparent text-[#6B7280] hover:text-[#111827]"
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
