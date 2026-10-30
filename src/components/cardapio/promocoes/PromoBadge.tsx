"use client";

import { cn } from "@/lib/utils";
import {
  BadgePercent,
  Crown,
  Flame,
  Gift,
  Sparkles,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { PromoBadge as Badge } from "./promo-utils";

const STYLES: Record<Badge["kind"], string> = {
  percent: "bg-[#F1EAF8] text-[#432078]",
  promocao: "bg-[#F1EAF8] text-[#432078]",
  cashback: "bg-[#E8F3EA] text-[#356344]",
  mais_vendido: "bg-[#EF4444] text-white",
  novidade: "bg-[#F1EAF8] text-[#432078]",
  premium: "border border-[#D4C4F0] bg-[#F3EEFA] text-[#5E35B1]",
  combo: "bg-[#F1EAF8] text-[#432078]",
  relampago: "bg-[#5B2C98] text-white",
  leve2: "bg-[#F1EAF8] text-[#432078]",
  frete: "bg-[#E8F3EA] text-[#356344]",
};

const ICONS: Record<Badge["kind"], LucideIcon> = {
  percent: BadgePercent,
  promocao: BadgePercent,
  cashback: BadgePercent,
  mais_vendido: Flame,
  novidade: Sparkles,
  premium: Crown,
  combo: Gift,
  relampago: Zap,
  leve2: Gift,
  frete: Truck,
};

export function PromoBadge({
  badge,
  className,
}: {
  badge: Badge;
  className?: string;
}) {
  const Icon = ICONS[badge.kind];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold leading-none",
        STYLES[badge.kind],
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.4} />
      {badge.label}
    </span>
  );
}
