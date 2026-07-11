"use client";

import { motion } from "framer-motion";
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
    <div className="border-b border-[#E5E7EB] bg-white px-4 sm:px-6">
      <nav className="flex gap-1 overflow-x-auto scrollbar-none" role="tablist">
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
                "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150",
                isActive
                  ? "text-[#4C258C]"
                  : "text-[#6B7280] hover:text-[#111827]"
              )}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="catalog-tab-underline"
                  className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-[#4C258C]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
