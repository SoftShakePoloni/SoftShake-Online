import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import type { RelatorioData, RelatorioFiltros } from "@/types/relatorios";
import {
  primaryReportKpis,
  reportClientStats,
  reportDate,
  reportDateKey,
  reportFilterLabels,
  reportMoney,
  reportNumber,
  reportValueLabel,
  validReportTrend,
} from "./presentation";

const INK: [number, number, number] = [41, 35, 47],
  MUTED: [number, number, number] = [112, 104, 121],
  PURPLE: [number, number, number] = [76, 37, 140],
  BORDER: [number, number, number] = [231, 227, 234];
const M = 16,
  W = 178,
  BOTTOM = 274;
type PdfDoc = jsPDF & { lastAutoTable?: { finalY: number } };
export type GeneratePdfOptions = {
  data: RelatorioData;
  emitidoPor: string;
  filtros?: RelatorioFiltros;
};

/** Vector content throughout: independent of viewport size and browser chart rendering. */
export async function generateRelatorioPdf({
  data,
  emitidoPor,
  filtros,
}: GeneratePdfOptions): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  }) as PdfDoc;
  doc.setProperties({
    title: "Relatório de desempenho",
    subject: data.range.label,
    author: data.empresa.nome || "SoftShake",
    creator: "SoftShake",
  });
  let y = 20;
  const text = (
    value: string,
    x: number,
    at: number,
    size = 9,
    color = INK,
    bold = false,
    align: "left" | "right" | "center" = "left",
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(value, x, at, { align });
  };
  const ensure = (height: number) => {
    if (y + height > BOTTOM) {
      doc.addPage();
      y = 24;
    }
  };
  const paragraph = (value: string, size = 8, color = MUTED) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(value, W);
    for (const line of lines) {
      ensure(5);
      text(line, M, y, size, color);
      y += 4.5;
    }
    y += 2;
  };
  const title = (value: string, room = 26) => {
    ensure(room);
    text(value, M, y, 12, INK, true);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(M, y + 3, M + W, y + 3);
    y += 10;
  };
  const table = (
    heading: string,
    head: string[],
    body: RowInput[],
    rightColumns: number[] = [],
  ) => {
    title(heading, body.length ? 34 : 20);
    if (!body.length) {
      paragraph("Sem registros neste período.");
      y += 3;
      return;
    }
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, top: 24, bottom: 24 },
      tableWidth: W,
      head: [head],
      body,
      theme: "plain",
      showHead: "everyPage",
      rowPageBreak: "avoid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.5,
        textColor: INK,
        lineColor: BORDER,
        lineWidth: 0,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: [246, 244, 249],
        textColor: INK,
        fontStyle: "bold",
        fontSize: 7.5,
        lineColor: BORDER,
        lineWidth: { bottom: 0.2 },
      },
      bodyStyles: { lineColor: BORDER, lineWidth: { bottom: 0.1 } },
      columnStyles: Object.fromEntries(
        rightColumns.map((index) => [index, { halign: "right" }]),
      ),
      didParseCell: (hook) => {
        if (hook.section === "head" && rightColumns.includes(hook.column.index))
          hook.cell.styles.halign = "right";
      },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 12;
  };
  // Optional original logo; preserve its native aspect ratio.
  let logoWidth = 0;
  if (data.empresa.logoUrl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(data.empresa.logoUrl, {
          signal: controller.signal,
        });
        if (res.ok) {
          const bytes = new Uint8Array(await res.arrayBuffer());
          const image = doc.getImageProperties(bytes);
          const scale = Math.min(18 / image.width, 16 / image.height);
          logoWidth = image.width * scale;
          doc.addImage(
            bytes,
            image.fileType,
            M,
            13,
            logoWidth,
            image.height * scale,
          );
        }
      } finally {
        clearTimeout(timer);
      }
    } catch {
      /* The report remains usable if the optional logo cannot be fetched. */
    }
  }
  text(
    data.empresa.nome || "SoftShake",
    M + (logoWidth ? logoWidth + 5 : 0),
    19,
    11,
    PURPLE,
    true,
  );
  text("Relatório de desempenho", M, 36, 22, INK, true);
  text(
    `${reportDate(data.range.from)} a ${reportDate(data.range.to)}`,
    M,
    44,
    10,
  );
  const emitted = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
  text(`Emitido em ${emitted}`, M + W, 19, 8, MUTED, false, "right");
  y = 51;
  paragraph(`Período: ${data.range.label}`);
  const selectedFilters = reportFilterLabels(filtros);
  paragraph(
    selectedFilters.length
      ? `Filtros: ${selectedFilters.join(" | ")}`
      : "Filtros: todos os status, pagamentos e canais.",
  );
  if (emitidoPor) paragraph(`Emitido por: ${emitidoPor}`);
  y += 4;
  title("Resumo executivo", 42);
  const kpis = primaryReportKpis(data.kpis);
  const cellWidth = W / 4;
  kpis.forEach((kpi, index) => {
    const x = M + index * cellWidth;
    text(kpi.label, x, y, 8, MUTED);
    doc.setFontSize(17);
    const size = Math.min(
      17,
      (17 * (cellWidth - 4)) /
        Math.max(doc.getTextWidth(kpi.value), cellWidth - 4),
    );
    text(kpi.value, x, y + 9, size, INK, true);
    const trend = validReportTrend(kpi);
    text(
      trend == null
        ? "Sem base comparável"
        : `${trend > 0 ? "+" : ""}${reportNumber(trend, 1)}% vs. anterior`,
      x,
      y + 16,
      7,
      MUTED,
    );
  });
  y += 25;
  paragraph(
    `Comparação: ${reportDate(data.prevRange.from)} a ${reportDate(data.prevRange.to)}. Percentuais apresentados somente com base anterior maior que zero.`,
    7,
  );
  y += 3;
  title("Evolução das vendas", 84);
  const series = data.faturamentoDiario;
  const valid = series.filter((row) => Number.isFinite(row.faturamento));
  if (!valid.length) {
    paragraph("Sem informações de vendas para o período.");
  } else if (!valid.some((row) => row.faturamento > 0)) {
    paragraph(
      `Nenhuma venda registrada no período. Faturamento: ${reportMoney(0)}.`,
    );
  } else {
    const x = M + 20,
      chartW = W - 24,
      top = y + 3,
      h = 42,
      max = Math.max(...valid.map((row) => row.faturamento), 1);
    for (let tick = 0; tick <= 3; tick++) {
      const cy = top + h - (tick * h) / 3;
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.15);
      doc.line(x, cy, x + chartW, cy);
      text(
        new Intl.NumberFormat("pt-BR", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format((max * tick) / 3),
        x - 3,
        cy + 1,
        7,
        MUTED,
        false,
        "right",
      );
    }
    text("R$", M, top - 2, 7, MUTED);
    const px = (index: number) =>
      x +
      (series.length === 1
        ? chartW / 2
        : (index * chartW) / (series.length - 1));
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(0.6);
    series.forEach((row, index) => {
      if (!Number.isFinite(row.faturamento)) return;
      const cy = top + h - (row.faturamento / max) * h;
      const previous = series[index - 1];
      if (previous && Number.isFinite(previous.faturamento))
        doc.line(
          px(index - 1),
          top + h - (previous.faturamento / max) * h,
          px(index),
          cy,
        );
      if (series.length <= 7) {
        doc.setFillColor(...PURPLE);
        doc.circle(px(index), cy, 0.8, "F");
        text(
          reportMoney(row.faturamento),
          px(index),
          cy - 3,
          6.5,
          MUTED,
          false,
          "center",
        );
      }
    });
    const step = Math.max(1, Math.ceil(series.length / 6));
    series.forEach((row, index) => {
      if (index % step === 0 || index === series.length - 1)
        text(row.label, px(index), top + h + 5, 7, MUTED, false, "center");
    });
    y = top + h + 13;
    paragraph(
      `Valores diários em reais. Linhas retas entre os registros, com escala iniciando em zero. Maior valor diário: ${reportMoney(max)}.`,
      7,
    );
  }
  y += 3;
  table(
    "Resumo financeiro",
    ["Indicador", "Valor"],
    [
      ["Faturamento bruto", reportMoney(data.financeiro.faturamentoBruto)],
      ["Descontos", reportMoney(data.financeiro.descontos)],
      ["Taxas de entrega", reportMoney(data.financeiro.taxaEntrega)],
      ["Total líquido", reportMoney(data.financeiro.totalLiquido)],
      ["Pagamento mais usado", data.financeiro.pagamentoMaisUsado],
    ],
    [1],
  );
  const distribution = (rows: { name: string; value: number }[]) => {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return rows.map((row) => [
      row.name,
      reportNumber(row.value),
      total > 0 ? `${reportNumber((row.value / total) * 100, 1)}%` : "Sem base",
    ]);
  };
  table(
    "Análise operacional · Status",
    ["Status", "Pedidos", "Participação"],
    distribution(data.status),
    [1, 2],
  );
  table(
    "Canais e tipos de pedido",
    ["Canal", "Pedidos", "Participação"],
    distribution(data.entregaVsRetirada),
    [1, 2],
  );
  // Preserve all hourly intervals; split across columns without removing zero counts.
  const hours = data.porHora,
    mid = Math.ceil(hours.length / 2);
  table(
    "Pedidos por horário",
    ["Horário", "Pedidos", "Horário", "Pedidos"],
    hours
      .slice(0, mid)
      .map((row, index) => [
        row.hora,
        reportNumber(row.pedidos),
        hours[index + mid]?.hora ?? "",
        hours[index + mid] ? reportNumber(hours[index + mid].pedidos) : "",
      ]),
    [1, 3],
  );
  table(
    "Análise comercial · Produtos mais vendidos",
    ["Produto", "Quantidade", "Receita", "Participação"],
    data.produtos.map((row) => [
      row.nome,
      reportNumber(row.quantidade),
      reportMoney(row.faturamento),
      `${reportNumber(row.participacao, 1)}%`,
    ]),
    [1, 2, 3],
  );
  table(
    "Formas de pagamento",
    ["Pagamento", "Pedidos", "Participação"],
    distribution(data.pagamentos),
    [1, 2],
  );
  title("Indicadores de clientes", 48);
  if (!data.clientes.length)
    paragraph("Nenhum cliente identificado no período.");
  else {
    const stats = reportClientStats(data.clientes);
    paragraph(
      `Base: ${data.clientes.length} clientes do ranking disponível. Não representa necessariamente toda a base de clientes. Uma compra no período não significa cliente novo.`,
      8,
    );
    paragraph(
      `Uma compra: ${reportNumber(stats.single)} | Duas ou mais: ${reportNumber(stats.repeat)} | Frequência média: ${reportNumber(stats.frequency, 1)} pedidos`,
      9,
      INK,
    );
    paragraph(
      `Média dos tickets por cliente: ${reportMoney(stats.ticket)}`,
      9,
      INK,
    );
  }
  table(
    "Clientes do período",
    ["Cliente", "Pedidos", "Total gasto", "Ticket médio", "Última compra"],
    data.clientes.map((row) => [
      row.nome,
      reportNumber(row.pedidos),
      reportMoney(row.totalGasto),
      reportMoney(row.ticketMedio),
      reportDate(row.ultimaCompra),
    ]),
    [1, 2, 3],
  );
  if (data.sabores.length)
    table(
      "Sabores mais vendidos",
      ["Sabor", "Quantidade", "Receita"],
      data.sabores.map((row) => [
        row.nome,
        reportNumber(row.quantidade),
        reportMoney(row.faturamento),
      ]),
      [1, 2],
    );
  if (data.adicionais.length)
    table(
      "Adicionais mais vendidos",
      ["Adicional", "Quantidade", "Receita"],
      data.adicionais.map((row) => [
        row.nome,
        reportNumber(row.quantidade),
        reportMoney(row.faturamento),
      ]),
      [1, 2],
    );
  table(
    "Pedidos do período",
    ["Pedido", "Cliente", "Data", "Status", "Pagamento", "Total"],
    data.pedidosLista.map((row) => [
      "#" + row.id.slice(0, 8),
      row.cliente,
      reportDate(row.data),
      reportValueLabel(row.status),
      reportValueLabel(row.pagamento),
      reportMoney(row.total),
    ]),
    [5],
  );
  table(
    "Destaques do período",
    ["Indicador", "Resultado"],
    [
      ["Maior venda", reportMoney(data.destaques.maiorVenda)],
      ["Menor venda", reportMoney(data.destaques.menorVenda)],
      ["Horário de maior movimento", data.destaques.horarioPico],
      ["Dia com mais pedidos", data.destaques.diaMaisPedidos],
      ["Produto mais vendido", data.destaques.produtoCampeao],
      ["Cliente que mais comprou", data.destaques.clienteTop],
      [
        "Tempo médio até conclusão",
        data.tempoMedioMinutos != null
          ? `${reportNumber(data.tempoMedioMinutos)} min`
          : "Sem informação",
      ],
    ],
  );
  if (data.observacoes?.trim()) {
    title("Observações");
    paragraph(data.observacoes.trim());
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    if (page > 1) {
      text("Relatório de desempenho", M, 14, 8, PURPLE, true);
      text(data.range.label, M + W, 14, 8, MUTED, false, "right");
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.line(M, 18, M + W, 18);
    }
    doc.setDrawColor(...BORDER);
    doc.line(M, 280, M + W, 280);
    text(
      `SoftShake | ${reportDate(data.range.from)} a ${reportDate(data.range.to)}`,
      M,
      286,
      7,
      MUTED,
    );
    text(`Página ${page} de ${pages}`, M + W, 286, 7, MUTED, false, "right");
  }
  return {
    blob: doc.output("blob"),
    filename: `SoftShake_Relatorio_${reportDateKey(data.range.from)}_a_${reportDateKey(data.range.to)}.pdf`,
  };
}
export {downloadPdfBlob} from "./download";
