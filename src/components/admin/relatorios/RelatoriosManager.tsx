"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Printer,
  RefreshCw,
  Bike,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  ChartMensal,
  ChartPedidosBar,
  ChartPizza,
  ChartSemana,
} from "./RelatorioCharts";
import {
  ComparativosCards,
  TabelaClientes,
  TabelaProdutos,
  TabelaRanking,
  TabelaTamanhos,
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
  { id: "mes_passado", label: "Mês passado" },
  { id: "custom", label: "Personalizado" },
];

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-[#E5E7EB]" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 h-80 rounded-2xl bg-white border border-[#E5E7EB]" />
        <div className="h-80 rounded-2xl bg-white border border-[#E5E7EB]" />
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

function exportExcel(data: RelatorioData) {
  // Excel abre CSV UTF-8 com BOM corretamente
  exportCSV(data);
  toast.success("Arquivo exportado (CSV compatível com Excel)");
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
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [adminName, setAdminName] = useState("Administrador");

  const load = useCallback(
    (f: RelatorioFiltros) => {
      setError(null);
      startTransition(async () => {
        try {
          const result = await getRelatorios(f);
          setData(result);
          setLastUpdated(new Date());
        } catch (e: unknown) {
          console.error(e);
          const msg =
            e instanceof Error ? e.message : "Erro ao carregar relatórios";
          setError(msg);
          toast.error("Erro ao carregar relatórios");
        }
      });
    },
    []
  );

  useEffect(() => {
    load(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Nome do admin vindo do topbar/sessão (local) ou fallback
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

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      // Garante dados frescos do período selecionado
      const result = await getRelatorios(filtros);
      setData(result);
      setLastUpdated(new Date());

      const { blob, filename } = await generateRelatorioPdf({
        data: result,
        emitidoPor: adminName,
      });
      downloadPdfBlob(blob, filename);
      toast.success("PDF gerado com sucesso", {
        description: filename,
      });
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Erro ao gerar PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  // Realtime: quando pedido muda, revalida o relatório (sem polling)
  useEffect(() => {
    const supabase = createClient();
    let t: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel("relatorios-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          // debounce leve para não reprocessar a cada update em rajada
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

  const applyFilters = () => {
    load(filtros);
    setShowFilters(false);
  };

  return (
    <div className="min-h-full bg-[#F7F8FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-5 sticky top-0 z-20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4C258C] to-[#7C3AED] flex items-center justify-center shadow-md shadow-purple-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827]">Relatórios</h1>
              <p className="text-sm text-[#6B7280]">
                Resumo completo do desempenho da loja
                {lastUpdated && (
                  <span className="text-[#9CA3AF]">
                    {" "}
                    · atualizado{" "}
                    {lastUpdated.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-[#F3F4F6] rounded-xl">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    filtros.preset === p.id
                      ? "bg-white text-[#4C258C] shadow-sm"
                      : "text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filtros
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={isPending}
              onClick={() => load(filtros)}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Custom range */}
        {filtros.preset === "custom" && (
          <div className="mt-4 flex flex-wrap items-end gap-3 p-3 rounded-xl bg-[#F8F9FC] border border-[#E5E7EB]">
            <div>
              <Label className="text-xs text-[#6B7280]">De</Label>
              <Input
                type="date"
                className="h-9 mt-1"
                value={filtros.from?.slice(0, 10) || ""}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, from: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs text-[#6B7280]">Até</Label>
              <Input
                type="date"
                className="h-9 mt-1"
                value={filtros.to?.slice(0, 10) || ""}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, to: e.target.value }))
                }
              />
            </div>
            <Button
              size="sm"
              className="h-9 bg-[#4C258C] hover:bg-[#5E35B1]"
              onClick={() => load(filtros)}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Aplicar período
            </Button>
          </div>
        )}

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 p-4 rounded-2xl border border-[#E5E7EB] bg-[#F8F9FC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={filtros.status || "todos"}
                onValueChange={(v) => setFiltros((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="h-9 mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Recebido</SelectItem>
                  <SelectItem value="preparando">Em preparo</SelectItem>
                  <SelectItem value="saiu_entrega">Saiu para entrega</SelectItem>
                  <SelectItem value="entregue">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pagamento</Label>
              <Select
                value={filtros.meio_pagamento || "todos"}
                onValueChange={(v) =>
                  setFiltros((f) => ({ ...f, meio_pagamento: v }))
                }
              >
                <SelectTrigger className="h-9 mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  {(data?.meiosPagamento || []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select
                value={filtros.tipo_entrega || "todos"}
                onValueChange={(v) =>
                  setFiltros((f) => ({ ...f, tipo_entrega: v }))
                }
              >
                <SelectTrigger className="h-9 mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="retirada">Retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cliente</Label>
              <Input
                className="h-9 mt-1 bg-white"
                placeholder="Nome ou telefone"
                value={filtros.cliente || ""}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, cliente: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Produto</Label>
              <Input
                className="h-9 mt-1 bg-white"
                placeholder="Nome do produto"
                value={filtros.produto || ""}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, produto: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Cidade</Label>
              <Select
                value={filtros.cidade || "todos"}
                onValueChange={(v) =>
                  setFiltros((f) => ({
                    ...f,
                    cidade: v === "todos" ? undefined : v,
                  }))
                }
              >
                <SelectTrigger className="h-9 mt-1 bg-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {(data?.cidades || []).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Bairro</Label>
              <Select
                value={filtros.bairro || "todos"}
                onValueChange={(v) =>
                  setFiltros((f) => ({
                    ...f,
                    bairro: v === "todos" ? undefined : v,
                  }))
                }
              >
                <SelectTrigger className="h-9 mt-1 bg-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {(data?.bairros || []).map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                className="h-9 flex-1 bg-[#4C258C] hover:bg-[#5E35B1]"
                onClick={applyFilters}
              >
                Aplicar filtros
              </Button>
              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  const reset: RelatorioFiltros = {
                    preset: filtros.preset,
                    from: filtros.from,
                    to: filtros.to,
                    status: "todos",
                    meio_pagamento: "todos",
                    tipo_entrega: "todos",
                  };
                  setFiltros(reset);
                  load(reset);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Export */}
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <Button
            size="sm"
            className="bg-[#4C258C] hover:bg-[#5E35B1] text-white"
            disabled={exportingPdf || isPending}
            onClick={handleExportPdf}
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-1.5" />
            )}
            {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data}
            onClick={() => data && exportCSV(data)}
          >
            <Download className="w-4 h-4 mr-1.5" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data}
            onClick={() => data && exportExcel(data)}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data}
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isPending && !data ? (
          <Skeleton />
        ) : data ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#6B7280]">
                Período:{" "}
                <span className="font-semibold text-[#111827]">
                  {data.range.label}
                </span>
                {" · "}
                {data.totalPedidosPeriodo} pedidos analisados
              </p>
              {isPending && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Atualizando…
                </span>
              )}
            </div>

            <RelatorioKpiCards kpis={data.kpis} />

            {/* Ops extras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bike className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#6B7280]">Entrega vs Retirada</p>
                  <div className="flex gap-4 mt-1">
                    {data.entregaVsRetirada.map((e) => (
                      <p key={e.name} className="text-sm font-semibold">
                        {e.name}: {e.percent ?? 0}%
                        <span className="text-[#9CA3AF] font-normal ml-1">
                          ({e.value})
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">
                    Tempo médio até conclusão
                  </p>
                  <p className="text-xl font-bold text-[#111827] mt-0.5">
                    {data.tempoMedioMinutos != null
                      ? `${data.tempoMedioMinutos} min`
                      : "—"}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    Pedidos finalizados no período
                  </p>
                </div>
              </div>
            </div>

            <ComparativosCards items={data.comparativos} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <ChartFaturamento data={data.faturamentoDiario} />
              <ChartPedidosBar data={data.pedidosDiarios} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ChartPizza
                title="Métodos de pagamento"
                description="Distribuição dos pedidos"
                data={data.pagamentos}
              />
              <ChartPizza
                title="Status dos pedidos"
                description="Funil operacional"
                data={data.status}
                donut
              />
              <ChartPizza
                title="Entrega × Retirada"
                data={data.entregaVsRetirada}
                donut
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <TabelaProdutos data={data.produtos} />
              <TabelaRanking
                title="Sabores mais vendidos"
                description="Baseado nas opções de sabor dos pedidos"
                data={data.sabores}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <TabelaTamanhos data={data.tamanhos} />
              <TabelaRanking
                title="Adicionais mais escolhidos"
                description="Nutella, cremes, frutas e outros"
                data={data.adicionais}
              />
            </div>

            <TabelaClientes data={data.clientes} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ChartHoras data={data.porHora} />
              <ChartSemana data={data.porDiaSemana} />
            </div>

            <ChartMensal data={data.receitaMensal} />
          </>
        ) : (
          <Skeleton />
        )}
      </div>

      <style jsx global>{`
        @media print {
          aside,
          .print\\:hidden,
          button {
            display: none !important;
          }
          main {
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
