import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { RelatorioData } from "@/types/relatorios";

const BRAND = {
  primary: [76, 37, 140] as [number, number, number],
  primaryLight: [124, 58, 237] as [number, number, number],
  dark: [17, 24, 39] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  soft: [238, 232, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  rowAlt: [249, 250, 251] as [number, number, number],
};

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const VERSION = "1.0.0";

type AutoTableDoc = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > PAGE_H - 22) {
    doc.addPage();
    return MARGIN + 8;
  }
  return y;
}

function drawFooter(doc: jsPDF, page: number, total: number, emittedAt: Date) {
  const y = PAGE_H - 12;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y - 4, PAGE_W - MARGIN, y - 4);

  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.text(
    `SoftShake Admin · v${VERSION} · Emitido em ${format(emittedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
    MARGIN,
    y
  );
  doc.text(`Página ${page} de ${total}`, PAGE_W - MARGIN, y, {
    align: "right",
  });
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 14);
  doc.setFillColor(...BRAND.primary);
  doc.roundedRect(MARGIN, y - 3.5, 1.8, 6, 0.5, 0.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, MARGIN + 5, y);
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y + 3, PAGE_W - MARGIN, y + 3);
  return y + 9;
}

function kpiBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string
) {
  doc.setFillColor(...BRAND.soft);
  doc.setDrawColor(...BRAND.border);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.muted);
  doc.text(label, x + 3.5, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.primary);
  doc.text(value, x + 3.5, y + 12);
}

function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  labels: string[],
  values: number[],
  color: [number, number, number]
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, x, y);

  const chartY = y + 4;
  const chartH = h - 14;
  const chartW = w;
  const max = Math.max(...values, 1);
  const n = values.length || 1;
  const gap = 1.2;
  const barW = Math.max(1.5, (chartW - gap * (n + 1)) / n);

  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.2);
  doc.line(x, chartY + chartH, x + chartW, chartY + chartH);

  values.forEach((v, i) => {
    const bh = (v / max) * (chartH - 2);
    const bx = x + gap + i * (barW + gap);
    const by = chartY + chartH - bh;
    doc.setFillColor(...color);
    doc.roundedRect(bx, by, barW, Math.max(bh, 0.4), 0.4, 0.4, "F");
  });

  // Labels: show every nth if many
  doc.setFontSize(5.5);
  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");
  const step = n > 20 ? Math.ceil(n / 10) : n > 12 ? 2 : 1;
  labels.forEach((lab, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    const bx = x + gap + i * (barW + gap) + barW / 2;
    doc.text(String(lab).slice(0, 6), bx, chartY + chartH + 3.5, {
      align: "center",
    });
  });
}

function drawPieLegend(
  doc: jsPDF,
  x: number,
  y: number,
  title: string,
  items: { name: string; value: number; percent?: number }[],
  colors: [number, number, number][]
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, x, y);

  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let cy = y + 5;

  // Mini donut using arcs approximated by wedges via triangles is complex in jspdf;
  // use colored bars + legend for print clarity
  items.slice(0, 6).forEach((item, i) => {
    const pct = item.percent ?? Number(((item.value / total) * 100).toFixed(1));
    const barW = (Math.min(pct, 100) / 100) * 55;
    const color = colors[i % colors.length];

    doc.setFillColor(...color);
    doc.roundedRect(x, cy - 2.2, 3, 3, 0.5, 0.5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.dark);
    doc.text(item.name.slice(0, 22), x + 5, cy);

    doc.setFillColor(...BRAND.rowAlt);
    doc.roundedRect(x + 42, cy - 2, 55, 3, 0.5, 0.5, "F");
    doc.setFillColor(...color);
    doc.roundedRect(x + 42, cy - 2, Math.max(barW, 0.5), 3, 0.5, 0.5, "F");

    doc.setTextColor(...BRAND.muted);
    doc.text(`${pct}% (${item.value})`, x + 100, cy);
    cy += 6;
  });

  return cy;
}

async function loadImageAsDataUrl(
  url: string
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" | "WEBP" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const type = blob.type || "image/png";
    const format: "PNG" | "JPEG" | "WEBP" = type.includes("jpeg") || type.includes("jpg")
      ? "JPEG"
      : type.includes("webp")
        ? "WEBP"
        : "PNG";
    return { dataUrl: `data:${type};base64,${base64}`, format };
  } catch {
    return null;
  }
}

export type GeneratePdfOptions = {
  data: RelatorioData;
  emitidoPor: string;
};

export async function generateRelatorioPdf({
  data,
  emitidoPor,
}: GeneratePdfOptions): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  }) as AutoTableDoc;

  const emittedAt = new Date();
  let y = MARGIN;

  // ========== HEADER ==========
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_W, 32, "F");
  doc.setFillColor(...BRAND.primaryLight);
  doc.rect(0, 32, PAGE_W, 1.2, "F");

  // Logo (optional)
  if (data.empresa.logoUrl) {
    try {
      const img = await loadImageAsDataUrl(data.empresa.logoUrl);
      if (img) {
        // WEBP may not work in all jspdf builds — try PNG/JPEG only
        if (img.format !== "WEBP") {
          doc.addImage(img.dataUrl, img.format, MARGIN, 6, 14, 14);
        }
      }
    } catch {
      // ignore logo errors
    }
  }

  doc.setTextColor(...BRAND.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.empresa.nome || "SoftShake", MARGIN + 18, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 210, 245);
  doc.text("Painel Administrativo", MARGIN + 18, 16.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.white);
  doc.text("RELATÓRIO GERENCIAL", PAGE_W - MARGIN, 11, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 210, 245);
  doc.text("Resumo das vendas e pedidos", PAGE_W - MARGIN, 16.5, {
    align: "right",
  });

  y = 40;

  // Meta block
  doc.setFillColor(...BRAND.rowAlt);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");

  const metaL = [
    `Período: ${data.range.label}`,
    `Emissão: ${format(emittedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
  ];
  const metaR = [
    `Responsável: ${emitidoPor}`,
    `Pedidos analisados: ${data.totalPedidosPeriodo}`,
  ];
  doc.text(metaL[0], MARGIN + 4, y + 6);
  doc.text(metaL[1], MARGIN + 4, y + 11.5);
  doc.text(metaR[0], PAGE_W - MARGIN - 4, y + 6, { align: "right" });
  doc.text(metaR[1], PAGE_W - MARGIN - 4, y + 11.5, { align: "right" });

  y += 22;

  // ========== RESUMO EXECUTIVO ==========
  y = sectionTitle(doc, "1. Resumo Executivo", y);

  const kpis = [
    { label: "Faturamento Total", value: money(data.financeiro.faturamentoBruto) },
    { label: "Qtd. de Pedidos", value: String(data.kpis.find((k) => k.key === "pedidos")?.value || "0") },
    { label: "Ticket Médio", value: data.kpis.find((k) => k.key === "ticket")?.value || money(0) },
    { label: "Clientes Atendidos", value: data.kpis.find((k) => k.key === "clientes")?.value || "0" },
    { label: "Pedidos Finalizados", value: String(data.status.find((s) => s.name === "Finalizado")?.value || 0) },
    { label: "Pedidos Cancelados", value: data.kpis.find((k) => k.key === "cancelados")?.value || "0" },
  ];

  const boxW = (CONTENT_W - 6) / 3;
  const boxH = 16;
  kpis.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = MARGIN + col * (boxW + 3);
    const by = y + row * (boxH + 3);
    kpiBox(doc, bx, by, boxW, boxH, k.label, k.value);
  });
  y += 2 * (boxH + 3) + 6;

  // ========== FINANCEIRO ==========
  y = sectionTitle(doc, "2. Resumo Financeiro", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Indicador", "Valor"]],
    body: [
      ["Faturamento Bruto", money(data.financeiro.faturamentoBruto)],
      ["Descontos", money(data.financeiro.descontos)],
      ["Taxa de entrega (soma)", money(data.financeiro.taxaEntrega)],
      ["Total líquido", money(data.financeiro.totalLiquido)],
      ["Forma de pagamento mais usada", data.financeiro.pagamentoMaisUsado],
    ],
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      textColor: BRAND.dark,
      lineColor: BRAND.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: "right", fontStyle: "bold" },
    },
  });
  y = (doc.lastAutoTable?.finalY || y) + 10;

  // ========== GRÁFICOS ==========
  y = ensureSpace(doc, y, 55);
  y = sectionTitle(doc, "3. Gráficos de Desempenho", y);

  const fatLabels = data.faturamentoDiario.map((d) => d.label);
  const fatValues = data.faturamentoDiario.map((d) => d.faturamento);
  const pedValues = data.pedidosDiarios.map((d) => d.pedidos);

  drawBarChart(
    doc,
    MARGIN,
    y,
    CONTENT_W / 2 - 3,
    42,
    "Faturamento diário (R$)",
    fatLabels,
    fatValues,
    BRAND.primary
  );
  drawBarChart(
    doc,
    MARGIN + CONTENT_W / 2 + 3,
    y,
    CONTENT_W / 2 - 3,
    42,
    "Pedidos por dia",
    fatLabels,
    pedValues,
    BRAND.primaryLight
  );
  y += 48;

  y = ensureSpace(doc, y, 50);
  const pieColors: [number, number, number][] = [
    BRAND.primary,
    BRAND.primaryLight,
    [167, 139, 250],
    BRAND.success,
    [59, 130, 246],
    BRAND.danger,
  ];
  const yPay = drawPieLegend(
    doc,
    MARGIN,
    y,
    "Métodos de pagamento",
    data.pagamentos,
    pieColors
  );
  const ySt = drawPieLegend(
    doc,
    MARGIN + CONTENT_W / 2 + 2,
    y,
    "Status dos pedidos",
    data.status,
    pieColors
  );
  y = Math.max(yPay, ySt) + 8;

  // ========== PRODUTOS ==========
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, "4. Produtos mais vendidos", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "Produto", "Qtd", "Receita", "Part. %"]],
    body: data.produtos.slice(0, 15).map((p, i) => [
      String(i + 1),
      p.nome,
      String(p.quantidade),
      money(p.faturamento),
      `${p.participacao}%`,
    ]),
    theme: "plain",
    styles: {
      fontSize: 8,
      cellPadding: 2.4,
      textColor: BRAND.dark,
      lineColor: BRAND.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: "bold",
    },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.row.index < 3) {
        hook.cell.styles.fontStyle = "bold";
        if (hook.column.index === 0) {
          hook.cell.styles.textColor = BRAND.primary;
        }
      }
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 20 },
    },
  });
  y = (doc.lastAutoTable?.finalY || y) + 10;

  // ========== SABORES ==========
  y = ensureSpace(doc, y, 35);
  y = sectionTitle(doc, "5. Sabores mais vendidos", y);
  if (data.sabores.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text("Sem dados de sabores no período.", MARGIN, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["#", "Sabor", "Qtd", "Receita"]],
      body: data.sabores.slice(0, 12).map((p, i) => [
        String(i + 1),
        p.nome,
        String(p.quantidade),
        money(p.faturamento),
      ]),
      theme: "plain",
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        textColor: BRAND.dark,
        lineColor: BRAND.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: BRAND.primary,
        textColor: BRAND.white,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: BRAND.rowAlt },
    });
    y = (doc.lastAutoTable?.finalY || y) + 10;
  }

  // ========== ADICIONAIS ==========
  y = ensureSpace(doc, y, 35);
  y = sectionTitle(doc, "6. Adicionais mais vendidos", y);
  if (data.adicionais.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text("Sem dados de adicionais no período.", MARGIN, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["#", "Adicional", "Qtd", "Receita"]],
      body: data.adicionais.slice(0, 12).map((p, i) => [
        String(i + 1),
        p.nome,
        String(p.quantidade),
        money(p.faturamento),
      ]),
      theme: "plain",
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        textColor: BRAND.dark,
        lineColor: BRAND.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: BRAND.primary,
        textColor: BRAND.white,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: BRAND.rowAlt },
    });
    y = (doc.lastAutoTable?.finalY || y) + 10;
  }

  // ========== CLIENTES ==========
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, "7. Clientes", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Nome", "Pedidos", "Total gasto", "Última compra", "Ticket médio"]],
    body: data.clientes.slice(0, 15).map((c) => [
      c.nome,
      String(c.pedidos),
      money(c.totalGasto),
      format(new Date(c.ultimaCompra), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      money(c.ticketMedio),
    ]),
    theme: "plain",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: BRAND.dark,
      lineColor: BRAND.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
  });
  y = (doc.lastAutoTable?.finalY || y) + 10;

  // ========== PEDIDOS ==========
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, "8. Pedidos do período", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Número", "Cliente", "Data", "Status", "Pagamento", "Total"]],
    body: data.pedidosLista.map((p) => [
      `#${p.id.slice(0, 8).toUpperCase()}`,
      p.cliente.slice(0, 22),
      format(new Date(p.data), "dd/MM/yy HH:mm", { locale: ptBR }),
      p.status,
      p.pagamento,
      money(p.total),
    ]),
    theme: "plain",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: BRAND.dark,
      lineColor: BRAND.border,
      lineWidth: 0.12,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
    columnStyles: {
      5: { halign: "right", fontStyle: "bold" },
    },
  });
  y = (doc.lastAutoTable?.finalY || y) + 10;

  // ========== ESTATÍSTICAS ==========
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, "9. Estatísticas e destaques", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Indicador", "Valor"]],
    body: [
      ["Maior venda", money(data.destaques.maiorVenda)],
      ["Menor venda", money(data.destaques.menorVenda)],
      ["Horário de maior movimento", data.destaques.horarioPico],
      ["Dia com mais pedidos", data.destaques.diaMaisPedidos],
      ["Produto campeão de vendas", data.destaques.produtoCampeao],
      ["Cliente que mais comprou", data.destaques.clienteTop],
      [
        "Tempo médio até conclusão",
        data.tempoMedioMinutos != null
          ? `${data.tempoMedioMinutos} min`
          : "—",
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.6,
      textColor: BRAND.dark,
      lineColor: BRAND.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
    columnStyles: {
      1: { fontStyle: "bold", halign: "right" },
    },
  });
  y = (doc.lastAutoTable?.finalY || y) + 10;

  // ========== OBSERVAÇÕES ==========
  y = ensureSpace(doc, y, 28);
  y = sectionTitle(doc, "10. Observações", y);
  doc.setFillColor(...BRAND.rowAlt);
  doc.roundedRect(MARGIN, y, CONTENT_W, 18, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.muted);
  const obs =
    data.observacoes?.trim() || "Nenhuma observação registrada.";
  const lines = doc.splitTextToSize(obs, CONTENT_W - 8);
  doc.text(lines, MARGIN + 4, y + 6);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages, emittedAt);
  }

  const stamp = format(emittedAt, "yyyy-MM-dd_HH-mm");
  const filename = `Relatorio_${stamp}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
