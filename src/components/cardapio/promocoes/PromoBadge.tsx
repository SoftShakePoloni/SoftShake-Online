"use client";

import { cn } from "@/lib/utils";
import type { PromoBadge as Badge } from "./promo-utils";

const STYLES: Record<
  Badge["kind"],
  string
> = {
  percent: "bg-[#4C258C] text-white",
  mais_vendido: "bg-[#111827] text-white",
  novidade: "bg-[#EEE8FA] text-[#4C258C]",
  premium: "bg-[#F3EEFA] text-[#5E35B1] border border-[#D4C4F0]",
  combo: "bg-[#F5F3FF] text-[#4C258C]",
  relampago: "bg-[#4C258C] text-white",
  leve2: "bg-[#111827] text-white",
};

export function PromoBadge({
  badge,
  className,
}: {
  badge: Badge;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        STYLES[badge.kind],
        className
      )}
    >
      {badge.label}
    </span>
  );
}
