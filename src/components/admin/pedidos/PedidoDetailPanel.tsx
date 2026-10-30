"use client";

import { useEffect, useState } from "react";
import { StorageImage as Image } from "@/components/ui/storage-image";
import {
  MapPin,
  Package,
  ExternalLink,
  Copy,
  Printer,
  X,
  Check,
  Bike,
  ChefHat,
  Flag,
  XCircle,
  MessageSquare,
} from "lucide-react";
import type { Pedido } from "@/types/pedido";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extractComplementos, groupComplementos } from "@/lib/utils/pedido";
import { toast } from "sonner";
import { OrderPrint, type OrderPrintTipo } from "./OrderPrint";
import {
  shortOrderId,
  tipoEntregaLabel,
  isDeliveryType,
  getOrderActions,
  STATUS_META,
  type OrderAction,
} from "./order-status";
import { OrderElapsedTimer } from "./OrderElapsedTimer";

interface PedidoDetailPanelProps {
  pedido: Pedido;
  onStatusChange: (
    status: Pedido["status"],
  ) => void | boolean | Promise<void | boolean>;
  onClose: () => void;
  busy?: boolean;
}

const actionIcons = {
  check: Check,
  x: XCircle,
  chef: ChefHat,
  bike: Bike,
  flag: Flag,
  package: Package,
  print: Printer,
};

const actionStyles: Record<OrderAction["variant"], string> = {
  primary:
    "bg-[#4C258C] hover:bg-[#5E35B1] text-white transition-colors duration-150",
  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-150",
  warning:
    "bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-150",
  danger:
    "text-red-600 hover:bg-red-50 border border-red-200 transition-colors duration-150",
  secondary:
    "text-[#4C258C] hover:bg-[#F3EEFA] border border-[#D4C4F0] transition-colors duration-150",
};

const orderDateTime = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

// Compact status badge colors
const STATUS_BADGE: Record<Pedido["status"], string> = {
  pendente:   "bg-purple-100 text-purple-800",
  confirmado: "bg-indigo-100 text-indigo-700",
  preparando: "bg-blue-100   text-blue-700",
  saiu_entrega: "bg-orange-100 text-orange-700",
  entregue:   "bg-emerald-100 text-emerald-700",
  cancelado:  "bg-red-100    text-red-700",
};

export function PedidoDetailPanel({
  pedido,
  onStatusChange,
  onClose,
  busy = false,
}: PedidoDetailPanelProps) {
  const [printTipo, setPrintTipo] = useState<OrderPrintTipo | null>(null);
  const actions = getOrderActions(pedido);
  const delivery = isDeliveryType(pedido.tipo_entrega);

  const primaryActions = actions.filter(
    (a) => a.variant === "primary" || a.variant === "success" || a.variant === "warning",
  );
  const secondaryActions = actions.filter((a) => a.variant === "secondary");
  const dangerActions    = actions.filter((a) => a.variant === "danger");

  const statusLabel = STATUS_META[pedido.status]?.label ?? pedido.status;
  const statusBadge = STATUS_BADGE[pedido.status] ?? "bg-gray-100 text-gray-600";

  const hasPrimaryEnterHint = primaryActions.some(
    (a) => a.status === "preparando" && !a.printAfter,
  );

  // â”€â”€ Print logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!printTipo) return;
    let printed = false;
    let finished = false;
    const runPrint = () => { if (printed) return; printed = true; window.print(); };
    const done    = () => { if (finished) return; finished = true; setPrintTipo(null); };
    const t1 = window.setTimeout(runPrint, 250);
    const t2 = window.setTimeout(done, 8000);
    window.addEventListener("afterprint", done);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("afterprint", done);
    };
  }, [printTipo]);

  // â”€â”€ Keyboard shortcuts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "Enter" && !busy) {
        const accept = actions.find((a) => a.status === "preparando" && !a.printAfter);
        if (accept) { e.preventDefault(); void onStatusChange(accept.status); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, busy, onClose, onStatusChange]);

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  const openWhatsApp = () => {
    if (!pedido.cliente_telefone) return;
    const phone = pedido.cliente_telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}`, "_blank");
  };

  const openMaps = () => {
    if (!pedido.endereco_completo) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.endereco_completo)}`,
      "_blank",
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="shrink-0 border-b border-[#F0EEF3] px-3 sm:px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <h2 className="text-lg font-bold text-[#111827] leading-none">
              #{shortOrderId(pedido.id)}
            </h2>

            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", statusBadge)}>
              {statusLabel}
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 shrink-0">
            <OrderElapsedTimer createdAt={pedido.created_at} compact />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Imprimir pedido"
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40"
                >
                  <Printer aria-hidden="true" className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPrintTipo("cozinha")}>
                  Cupom da cozinha
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPrintTipo("completo")}>
                  Completo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sub-line: time */}
        <p className="mt-1 text-xs text-[#9CA3AF]">
          {orderDateTime.format(new Date(pedido.created_at))}
          {" · "}
          {tipoEntregaLabel(pedido.tipo_entrega)}
        </p>
      </div>

      {/* â”€â”€ ACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {actions.length > 0 && (
        <div className="shrink-0 border-b border-[#F0EEF3] px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {primaryActions.map((action) => {
              const Icon = actionIcons[action.icon];
              return (
                <button
                  key={`${action.label}-${action.status}`}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      const result = await onStatusChange(action.status);
                      if (action.printAfter && result !== false) setPrintTipo("completo");
                    })();
                  }}
                  aria-label={action.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40",
                    actionStyles[action.variant],
                    primaryActions.length === 1 && "flex-1 justify-center",
                  )}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  {action.label}
                </button>
              );
            })}

            {secondaryActions.map((action) => {
              const Icon = actionIcons[action.icon];
              return (
                <button
                  key={`${action.label}-${action.status}-s`}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      const result = await onStatusChange(action.status);
                      if (action.printAfter && result !== false) setPrintTipo("completo");
                    })();
                  }}
                  aria-label={action.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40",
                    actionStyles[action.variant],
                  )}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  {action.label}
                </button>
              );
            })}

            {dangerActions.map((action) => {
              const Icon = actionIcons[action.icon];
              return (
                <button
                  key={`${action.label}-${action.status}-d`}
                  type="button"
                  disabled={busy}
                  onClick={() => { void onStatusChange(action.status); }}
                  aria-label={action.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300",
                    actionStyles[action.variant],
                  )}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  {action.label}
                </button>
              );
            })}

            {hasPrimaryEnterHint && (
              <span className="ml-auto text-[11px] text-[#D1D5DB] select-none">
                Enter â†µ
              </span>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="px-3 sm:px-5 py-4 space-y-5">

          {/* Items */}
          <ul className="divide-y divide-[#F3F4F6]">
            {pedido.itens.map((item, index) => {
              const complementos = extractComplementos(item);
              const grupos = groupComplementos(complementos);
              return (
                <li key={item.uid || item.id || index} className="py-3 first:pt-0">
                  <div className="flex items-start gap-2.5">
                    {/* Qty */}
                    <span className="mt-px flex h-5 min-w-[24px] items-center justify-center rounded bg-[#F3EEFA] px-1 text-[11px] font-bold text-[#4C258C] tabular-nums shrink-0">
                      {item.qty}x
                    </span>

                    {/* Name + extras */}
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-[#111827] leading-snug">
                        {item.produto.name}
                      </span>

                      {grupos.map((grupo, gi) => (
                        <div key={gi} className="mt-0.5">
                          {grupo.items.map((opcao, oi) => (
                            <p key={oi} className="text-xs text-[#9CA3AF]">
                              + {opcao.name}
                              {Number(opcao.price) > 0 ? ` · ${formatCurrency(opcao.price)}` : ""}
                            </p>
                          ))}
                        </div>
                      ))}

                      {item.observacoes && (
                        <p className="mt-0.5 text-xs text-[#9CA3AF] italic">
                          {item.observacoes}
                        </p>
                      )}
                    </div>

                    {/* Price + image */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-sm font-semibold text-[#111827] tabular-nums">
                        {formatCurrency(item.total)}
                      </span>
                      {item.produto.image && (
                        <div className="relative h-9 w-9 overflow-hidden rounded-md bg-[#F3F4F6] shrink-0">
                          <Image
                            src={item.produto.image}
                            alt={item.produto.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ObservaÃ§Ãµes do pedido */}
          {pedido.observacoes && (
            <p className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-900 leading-relaxed">
              {pedido.observacoes}
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-[#F3F4F6]" aria-hidden="true" />

          {/* Cliente */}
          <div className="space-y-1">
            <p className="font-medium text-[#111827]">{pedido.cliente_nome}</p>

            {pedido.cliente_telefone && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#6B7280]">{pedido.cliente_telefone}</span>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  aria-label="WhatsApp"
                  className="flex h-6 w-6 items-center justify-center rounded text-[#9CA3AF] hover:text-[#25D366] hover:bg-[#F0FDF4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40"
                >
                  <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => copy(pedido.cliente_telefone!)}
                  aria-label="Copiar telefone"
                  className="flex h-6 w-6 items-center justify-center rounded text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F9FAFB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40"
                >
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {pedido.endereco_completo && (
              <div className="flex items-start gap-1.5 mt-1">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 mt-0.5 text-[#9CA3AF] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {pedido.endereco_completo}
                  </p>
                  <button
                    type="button"
                    onClick={openMaps}
                    aria-label="Abrir no mapa"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#4C258C] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40"
                  >
                    <ExternalLink aria-hidden="true" className="h-3 w-3" />
                    Ver no mapa
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#F3F4F6]" aria-hidden="true" />

          {pedido.cupom_codigo && (
            <section aria-label="Cupom utilizado" className="space-y-2 border-b border-border pb-4 text-sm">
              <p className="font-medium text-primary">Cupom {pedido.cupom_codigo}</p>
              <dl className="space-y-1">
                <div className="flex justify-between gap-3"><dt>Subtotal antes do desconto</dt><dd>{formatCurrency(pedido.subtotal)}</dd></div>
                <div className="flex justify-between gap-3 text-primary"><dt>Desconto aplicado</dt><dd>− {formatCurrency(Number(pedido.desconto_cupom || 0))}</dd></div>
                <div className="flex justify-between gap-3 font-semibold"><dt>Total final</dt><dd>{formatCurrency(pedido.total)}</dd></div>
              </dl>
            </section>
          )}
          {/* Total + pagamento â€” uma Ãºnica linha */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">
              {pedido.meio_pagamento}
              {Number(pedido.troco_para) > 0 && ` · troco p/ ${formatCurrency(pedido.troco_para)}`}
              {" · "}
              {Number(pedido.taxa_entrega) > 0
                ? `entrega ${formatCurrency(pedido.taxa_entrega)}`
                : delivery ? "entrega grátis" : "retirada"}
            </span>
            <span className="text-base font-bold text-[#111827] tabular-nums">
              {formatCurrency(pedido.total)}
            </span>
          </div>

        </div>
      </div>

      {/* Print */}
      {printTipo && <OrderPrint pedido={pedido} tipo={printTipo} />}
    </div>
  );
}
