"use client";

import { BadgePercent, Boxes, Layers, ListChecks, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogTab } from "./types";

const TABS: { id: CatalogTab; label: string; icon: typeof Package }[] = [
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "complementos", label: "Complementos", icon: Layers },
  { id: "opcoes", label: "Opções", icon: ListChecks },
  { id: "combos", label: "Combos", icon: Boxes },
  { id: "promocoes", label: "Promoções", icon: BadgePercent },
];

export function CatalogoTabs({
  active,
  onChange,
}: {
  active: CatalogTab;
  onChange: (tab: CatalogTab) => void;
}) {
  return (
    <div className="catalog-tabs">
      <nav aria-label="Áreas do catálogo" role="tablist">
        {TABS.map(({ id, label, icon: Icon }, index) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight" ? (index + 1) % TABS.length
                  : event.key === "ArrowLeft" ? (index + TABS.length - 1) % TABS.length
                  : event.key === "Home" ? 0
                  : event.key === "End" ? TABS.length - 1
                  : -1;
                if (next < 0) return;
                event.preventDefault();
                onChange(TABS[next].id);
                const target =
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    '[role="tab"]',
                  )[next];
                target?.focus();
                target?.scrollIntoView({ block: "nearest", inline: "nearest" });
              }}
              onClick={() => onChange(id)}
              className={cn("catalog-tab", isActive && "is-active")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
