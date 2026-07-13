"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getRelatorios } from "@/actions/admin/relatorios";
import type {
  RelatorioData,
  RelatorioFiltros,
  RelatorioPeriodoPreset,
} from "@/types/relatorios";
import { RelatorioKpiCards } from "./RelatorioKpiCards";
import {
  ChartFaturamento,
  ChartHoras,
  ChartPedidosBar,
  ChartPizza,
  ChartCategorias,
} from "./RelatorioCharts";
import {
  ComparativosCards,
  TabelaClientes,
  TabelaProdutos,
} from "./RelatorioTables";
import { createClient } from "@/lib/supabase/client";
import {
  downloadPdfBlob,
  generateRelatorioPdf,
} from "@/lib/relatorios/generateRelatorioPdf";

const PRESETS: { id: RelatorioPeriodoPreset; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "mes", label: "Este mês" },
  { id: "custom", label: "Personalizado" },
];

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[76px] rounded-md bg-white border border-[#E5E7EB]"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 h-64 rounded-md bg-white border border-[#E5E7EB]" />
        <div className="h-64 rounded-md bg-white border border-[#E5E7EB]" />
      </div>
    </div>
  );
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(data: RelatorioData) {
  const lines = [
    "Relatório SoftShake",
    `Período,${data.range.label}`,
    "",
    "KPI,Valor",
    ...data.kpis.map((k) => `${k.label},${k.value}`),
    "",
    "Produtos,Quantidade,Faturamento,Participação%",
    ...data.produtos.map(
      (p) =>
        `"${p.nome}",${p.quantidade},${p.faturamento.toFixed(2)},${p.participacao}`
    ),
    "",
    "Clientes,Pedidos,Total,Ticket,Última compra",
    ...data.clientes.map(
      (c) =>
        `"${c.nome}",${c.pedidos},${c.totalGasto.toFixed(2)},${c.ticketMedio.toFixed(2)},${c.ultimaCompra}`
    ),
  ];
  downloadBlob(
    "\uFEFF" + lines.join("\n"),
    `relatorio-softshake-${Date.now()}.csv`,
    "text/csv;charset=utf-8;"
  );
}

export function RelatoriosManager() {
  const [filtros, setFiltros] = useState<RelatorioFiltros>({
    preset: "30d",
    status: "todos",
    meio_pagamento: "todos",
    tipo_entrega: "todos",
  });
  const [data, setData] = useState<RelatorioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [adminName, setAdminName] = useState("Administrador");

  const load = useCallback((f: RelatorioFiltros) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await getRelatorios(f);
        setData(result);
      } catch (e: unknown) {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "Erro ao carregar relatórios"
        );
        toast.error("Erro ao carregar relatórios");
      }
    });
  }, []);

  useEffect(() => {
    load(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("softshake-admin-name") ||
        document
          .querySelector("[data-admin-name]")
          ?.getAttribute("data-admin-name");
      if (raw) setAdminName(raw);
    } catch {
      // ignore
    }
  }, []);

  // Realtime
  useEffect(() => {
    const supabase = createClient();
    let t: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel("relatorios-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          if (t) clearTimeout(t);
          t = setTimeout(() => load(filtros), 800);
        }
      )
      .subscribe();
    return () => {
      if (t) clearTimeout(t);
      void supabase.removeChannel(channel);
    };
  }, [filtros, load]);

  const applyPreset = (preset: RelatorioPeriodoPreset) => {
    const next = { ...filtros, preset };
    setFiltros(next);
    load(next);
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const result = await getRelatorios(filtros);
      setData(result);
      const { blob, filename } = await generateRelatorioPdf({
        data: result,
        emitidoPor: adminName,
      });
      downloadPdfBlob(blob, filename);
      toast.success("PDF exportado");
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Erro ao gerar PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const btnOutline =
    "inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-50";

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5 py-4 space-y-4">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {data && (
              <p className="text-[13px] text-[#6B7280]">
                Período:{" "}
                <span className="font-medium text-[#111827]">
                  {data.range.label}
                </span>
                <span className="text-[#D1D5DB]"> · </span>
                {data.totalPedidosPeriodo} pedidos
                {isPending && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[#9CA3AF]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Atualizando
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className={cn(
                    "h-8 px-2.5 rounded text-[12px] font-medium transition-colors",
                    filtros.preset === p.id
                      ? "bg-[#DC2626] text-white"
                      : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={btnOutline}
              disabled={exportingPdf || isPending}
              onClick={() => void handleExportPdf()}
            >
              {exportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              PDF
            </button>
            <button
              type="button"
              className={btnOutline}
              disabled={!data}
              onClick={() => {
                if (!data) return;
                exportCSV(data);
                toast.success("Excel/CSV exportado");
              }}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>
            <button
              type="button"
              className={btnOutline}
              disabled={!data}
              onClick={() => {
                if (!data) return;
                exportCSV(data);
                toast.success("CSV exportado");
              }}
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              type="button"
              className={btnOutline}
              disabled={isPending}
              onClick={() => load(filtros)}
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
              />
              Atualizar
            </button>
          </div>
        </div>

        {/* Período personalizado */}
        {filtros.preset === "custom" && (
          <div className="flex flex-wrap items-end gap-2 rounded-md border border-[#E5E7EB] bg-white p-3">
            <div>
              <Label className="text-[11px] text-[#6B7280]">De</Label>
              <Input
                type="date"
                className="h-8 mt-1 w-[140px] rounded-md text-[13px]"
                value={filtros.from?.slice(0, 10) || ""}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, from: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[11px] text-[#6B7280]">Até</Label>
              <Input
                type="date"
                className="h-8 mt-1 w-[140px] rounded-md text-[13px]"
                value={filtros.to?.slice(0, 10) || ""}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, to: e.target.value }))
                }
              />
            </div>
            <button
              type="button"
              className="h-8 px-3 rounded-md bg-[#DC2626] text-white text-[12px] font-medium hover:bg-[#B91C1C]"
              onClick={() => load(filtros)}
            >
              Aplicar
            </button>
          </div>
        )}

        {/* Filtros compactos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Select
            value={filtros.status || "todos"}
            onValueChange={(v) => {
              const next = { ...filtros, status: v };
              setFiltros(next);
              load(next);
            }}
          >
            <SelectTrigger className="h-8 w-[120px] rounded-md border-[#E5E7EB] text-[12px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-[12px]">
                Status
              </SelectItem>
              <SelectItem value="pendente" className="text-[12px]">
                Novo
              </SelectItem>
              <SelectItem value="preparando" className="text-[12px]">
                Em preparo
              </SelectItem>
              <SelectItem value="saiu_entrega" className="text-[12px]">
                Entrega
              </SelectItem>
              <SelectItem value="entregue" className="text-[12px]">
                Finalizado
              </SelectItem>
              <SelectItem value="cancelado" className="text-[12px]">
                Cancelado
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.meio_pagamento || "todos"}
            onValueChange={(v) => {
              const next = { ...filtros, meio_pagamento: v };
              setFiltros(next);
              load(next);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] rounded-md border-[#E5E7EB] text-[12px] bg-white">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-[12px]">
                Pagamento
              </SelectItem>
              <SelectItem value="pix" className="text-[12px]">
                PIX
              </SelectItem>
              <SelectItem value="dinheiro" className="text-[12px]">
                Dinheiro
              </SelectItem>
              <SelectItem value="cartao" className="text-[12px]">
                Cartão
              </SelectItem>
              {(data?.meiosPagamento || []).map((m) => (
                <SelectItem key={m} value={m} className="text-[12px]">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.tipo_entrega || "todos"}
            onValueChange={(v) => {
              const next = { ...filtros, tipo_entrega: v };
              setFiltros(next);
              load(next);
            }}
          >
            <SelectTrigger className="h-8 w-[120px] rounded-md border-[#E5E7EB] text-[12px] bg-white">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-[12px]">
                Canal
              </SelectItem>
              <SelectItem value="entrega" className="text-[12px]">
                Entrega
              </SelectItem>
              <SelectItem value="retirada" className="text-[12px]">
                Retirada
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {isPending && !data ? (
          <Skeleton />
        ) : data ? (
          <div className={cn("space-y-3", isPending && "opacity-70")}>
            {/* KPIs */}
            <RelatorioKpiCards kpis={data.kpis} />

            {/* Vendas + Pagamento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <ChartFaturamento data={data.faturamentoDiario} />
              <ChartPizza data={data.pagamentos} />
            </div>

            {/* Horário + Status + Canal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <ChartHoras data={data.porHora} />
              <ChartPedidosBar data={data.status} />
              <ChartCategorias data={data.entregaVsRetirada} />
            </div>

            {/* Produtos + Clientes + Comparativo */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-3">
                <TabelaProdutos data={data.produtos} />
              </div>
              <div className="lg:col-span-2 space-y-3">
                <TabelaClientes data={data.clientes} />
                <ComparativosCards data={data.comparativos} />
              </div>
            </div>

            {/* Últimos pedidos do relatório */}
            {data.pedidosLista?.length > 0 && (
              <section className="rounded-md border border-[#E5E7EB] bg-white p-4">
                <h3 className="text-[13px] font-semibold text-[#111827] mb-3">
                  Pedidos do período
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                        <th className="pb-2 pr-2 font-medium">Pedido</th>
                        <th className="pb-2 pr-2 font-medium">Cliente</th>
                        <th className="pb-2 pr-2 font-medium">Status</th>
                        <th className="pb-2 pr-2 font-medium">Pagamento</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {data.pedidosLista.slice(0, 10).map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAFAFA]">
                          <td className="py-2 pr-2 font-medium tabular-nums text-[#111827]">
                            #{String(p.id).slice(0, 6)}
                          </td>
                          <td className="py-2 pr-2 text-[#374151] truncate max-w-[140px]">
                            {p.cliente}
                          </td>
                          <td className="py-2 pr-2 text-[#6B7280]">{p.status}</td>
                          <td className="py-2 pr-2 text-[#6B7280] capitalize">
                            {p.pagamento}
                          </td>
                          <td className="py-2 text-right font-semibold tabular-nums">
                            {p.total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
