"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Target,
  XCircle,
  CheckCircle2,
  Clock,
  Bike,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiCard } from "@/types/relatorios";

const iconMap = {
  DollarSign,
  ShoppingBag,
  Users,
  Target,
  XCircle,
  CheckCircle2,
  Clock,
  Bike,
};

const variants = {
  purple: { bg: "bg-[#EEE8FA]", color: "text-[#4C258C]" },
  blue: { bg: "bg-blue-50", color: "text-blue-600" },
  green: { bg: "bg-emerald-50", color: "text-emerald-600" },
  orange: { bg: "bg-amber-50", color: "text-amber-600" },
  pink: { bg: "bg-pink-50", color: "text-pink-600" },
  red: { bg: "bg-red-50", color: "text-red-600" },
};

export function RelatorioKpiCards({ kpis }: { kpis: KpiCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon] || DollarSign;
        const style = variants[kpi.variant];
        const hasTrend = kpi.trend != null;
        const positive = (kpi.trend ?? 0) >= 0;

        return (
          <div
            key={kpi.key}
            className="group bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-lg hover:border-[#D1D5DB] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                  style.bg
                )}
              >
                <Icon className={cn("w-5 h-5", style.color)} />
              </div>
              {hasTrend && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-lg",
                    positive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {positive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(kpi.trend!)}%
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-[#6B7280] mb-1">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-[#111827] tracking-tight tabular-nums">
              {kpi.value}
            </p>
            {(kpi.subtitle || kpi.trendLabel) && (
              <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                {kpi.subtitle || kpi.trendLabel}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
