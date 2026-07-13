"use client";

import { cn } from "@/lib/utils";
import type { KpiCard } from "@/types/relatorios";

/** Exibe só os 4 KPIs principais, estilo analytics compacto */
const PRIMARY_KEYS = ["faturamento", "pedidos", "ticket", "clientes"];

export function RelatorioKpiCards({ kpis }: { kpis: KpiCard[] }) {
  const primary = PRIMARY_KEYS.map((key) =>
    kpis.find((k) => k.key === key)
  ).filter(Boolean) as KpiCard[];

  const list = primary.length > 0 ? primary : kpis.slice(0, 4);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {list.map((kpi) => {
        const hasTrend = kpi.trend != null;
        const positive = (kpi.trend ?? 0) >= 0;

        return (
          <div
            key={kpi.key}
            className="rounded-md border border-[#E5E7EB] bg-white px-3.5 py-3"
          >
            <p className="text-[12px] text-[#6B7280]">{kpi.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-[#111827]">
                {kpi.value}
              </p>
              {hasTrend && (
                <span
                  className={cn(
                    "text-[12px] font-medium tabular-nums shrink-0",
                    positive ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {positive ? "▲" : "▼"} {positive ? "+" : ""}
                  {kpi.trend}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
