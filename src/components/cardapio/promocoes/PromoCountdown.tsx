"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCountdown, msUntilEndOfDay } from "./promo-utils";

/** Contador até o fim do dia (ofertas do dia). */
export function PromoCountdown({ className }: { className?: string }) {
  const [ms, setMs] = useState(() => msUntilEndOfDay());

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilEndOfDay()), 1000);
    return () => clearInterval(id);
  }, []);

  const { text, urgent } = formatCountdown(ms);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium tabular-nums",
        urgent ? "text-red-600" : "text-[#6B7280]",
        className
      )}
    >
      <Clock className="h-3 w-3 shrink-0" />
      <span>
        Termina em <span className="font-semibold">{text}</span>
      </span>
    </div>
  );
}
