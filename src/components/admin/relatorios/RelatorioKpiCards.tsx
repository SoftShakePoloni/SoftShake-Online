"use client";
import type { KpiCard } from "@/types/relatorios";
import {
  primaryReportKpis,
  reportDate,
  reportNumber,
  validReportTrend,
} from "@/lib/relatorios/presentation";
export function RelatorioKpiCards({
  kpis,
  previousRange,
}: {
  kpis: KpiCard[];
  previousRange?: { from: string; to: string };
}) {
  return (
    <section aria-label="Indicadores principais">
      <dl className="report-kpis">
        {primaryReportKpis(kpis).map((kpi) => {
          const trend = validReportTrend(kpi);
          return (
            <div key={kpi.key}>
              <dt>{kpi.label}</dt>
              <dd>{kpi.value}</dd>
              <p
                className={
                  trend == null
                    ? ""
                    : trend > 0
                      ? "report-up"
                      : trend < 0
                        ? "report-down"
                        : ""
                }
              >
                {trend == null
                  ? "Sem base comparável"
                  : `${trend > 0 ? "+" : ""}${reportNumber(trend, 1)}% em relação ao período anterior`}
              </p>
            </div>
          );
        })}
      </dl>
      {previousRange && (
        <p className="report-comparison-caption">
          Comparação com {reportDate(previousRange.from)} a{" "}
          {reportDate(previousRange.to)}.
        </p>
      )}
    </section>
  );
}
