"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import {
  Phone,
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
  ShoppingBag,
  MessageSquare,
  CreditCard,
  Clock,
  ArrowLeft,
} from "lucide-react";
import type { Pedido } from "@/types/pedido";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  extractComplementos,
  groupComplementos,
} from "@/lib/utils/pedido";
import { toast } from "sonner";
import { OrderPrint, type OrderPrintTipo } from "./OrderPrint";
import {
  STATUS_META,
  shortOrderId,
  tipoEntregaLabel,
  isDeliveryType,
  getOrderActions,
  type OrderAction,
} from "./order-status";
import { OrderElapsedTimer } from "./OrderElapsedTimer";

interface PedidoDetailPanelProps {
  pedido: Pedido;
  onStatusChange: (
    status: Pedido["status"]
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
  primary: "bg-[#4C258C] hover:bg-[#3d1d70] text-white",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  warning: "bg-orange-500 hover:bg-orange-600 text-white",
  danger: "bg-white hover:bg-red-50 text-red-600 border border-red-200",
  secondary:
    "bg-white hover:bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB]",
};

export function PedidoDetailPanel({
  pedido,
  onStatusChange,
  onClose,
  busy = false,
}: PedidoDetailPanelProps) {
  const [printTipo, setPrintTipo] = useState<OrderPrintTipo | null>(null);
  const meta = STATUS_META[pedido.status] ?? STATUS_META.pendente;
  const actions = getOrderActions(pedido);
  const delivery = isDeliveryType(pedido.tipo_entrega);

  useEffect(() => {
    if (!printTipo) return;
    let printed = false;
    let finished = false;
    const runPrint = () => {
      if (printed) return;
      printed = true;
      window.print();
    };
    const done = () => {
      if (finished) return;
      finished = true;
      setPrintTipo(null);
    };
    const t1 = window.setTimeout(runPrint, 250);
    const t2 = window.setTimeout(done, 8000);
    window.addEventListener("afterprint", done);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("afterprint", done);
    };
  }, [printTipo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Enter" && !busy) {
        const accept = actions.find(
          (a) => a.status === "preparando" && !a.printAfter
        );
        if (accept) {
          e.preventDefault();
          void onStatusChange(accept.status);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, busy, onClose, onStatusChange]);

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
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        pedido.endereco_completo
      )}`,
      "_blank"
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E5E7EB] px-4 lg:px-5 py-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden h-8 w-8 -ml-1 rounded-md flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6]"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[15px] font-semibold text-[#111827]">
                Pedido #{shortOrderId(pedido.id)}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                  meta.badge
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                {meta.label}
              </span>
              <OrderElapsedTimer createdAt={pedido.created_at} compact />
            </div>
            <p className="text-[12px] text-[#6B7280] mt-1 flex items-center gap-1 pl-0 lg:pl-0">
              <Clock className="w-3 h-3" />
              {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
              <span className="text-[#D1D5DB]">·</span>
              {formatDistanceToNow(new Date(pedido.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md border-[#E5E7EB] text-[13px]"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Imprimir
                </Button>
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
              className="hidden lg:flex h-8 w-8 rounded-md items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6]"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {actions.map((action) => {
              const Icon = actionIcons[action.icon];
              return (
                <Button
                  key={`${action.label}-${action.status}-${action.printAfter ? "p" : ""}`}
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      const result = await onStatusChange(action.status);
                      if (action.printAfter && result !== false) {
                        setPrintTipo("completo");
                      }
                    })();
                  }}
                  className={cn(
                    "h-8 rounded-md text-[13px] font-medium",
                    actionStyles[action.variant]
                  )}
                >
                  <Icon className="w-3.5 h-3.5 mr-1" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-[#9CA3AF]">Enter aceita · Esc fecha</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-3 space-y-3">
        <section className="rounded-md border border-[#E5E7EB] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">
            Cliente
          </p>
          <p className="text-[15px] font-semibold text-[#111827]">
            {pedido.cliente_nome}
          </p>
          {pedido.cliente_telefone && (
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              {pedido.cliente_telefone}
            </p>
          )}
          <p className="text-[12px] text-[#9CA3AF] mt-1">
            {tipoEntregaLabel(pedido.tipo_entrega)}
          </p>
          {pedido.cliente_telefone && (
            <div className="flex gap-1.5 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md border-[#E5E7EB] text-[12px]"
                onClick={() => copy(pedido.cliente_telefone!)}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-md bg-[#25D366] hover:bg-[#20BA5A] text-white text-[12px]"
                onClick={openWhatsApp}
              >
                <Phone className="w-3 h-3 mr-1" />
                WhatsApp
              </Button>
            </div>
          )}
        </section>

        {pedido.endereco_completo && (
          <section className="rounded-md border border-[#E5E7EB] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Endereço
            </p>
            <p className="text-[13px] text-[#374151] leading-relaxed">
              {pedido.endereco_completo}
            </p>
            <button
              type="button"
              onClick={openMaps}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#4C258C] hover:underline mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir no mapa
            </button>
          </section>
        )}

        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Itens ({pedido.itens.length})
          </p>
          <ul className="rounded-md border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
            {pedido.itens.map((item, index) => {
              const complementos = extractComplementos(item);
              const grupos = groupComplementos(complementos);
              return (
                <li
                  key={item.uid || item.id || index}
                  className="p-3 flex gap-2.5"
                >
                  {item.produto.image ? (
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-[#F3F4F6] shrink-0">
                      <Image
                        src={item.produto.image}
                        alt={item.produto.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#F3F4F6] flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-[#9CA3AF]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-[13px] font-medium text-[#111827]">
                        <span className="text-[#4C258C] font-bold mr-1">
                          {item.qty}x
                        </span>
                        {item.produto.name}
                      </p>
                      <span className="text-[13px] font-semibold tabular-nums shrink-0">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                    {grupos.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {grupos.map((g, gi) => (
                          <div key={gi}>
                            <p className="text-[10px] font-semibold text-[#6B7280] uppercase">
                              {g.groupName}
                            </p>
                            {g.items.map((c, ci) => (
                              <div
                                key={ci}
                                className="flex justify-between text-[12px] text-[#6B7280]"
                              >
                                <span>+ {c.name}</span>
                                {Number(c.price) > 0 && (
                                  <span>+{formatCurrency(c.price)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.observacoes && (
                      <p className="text-[12px] text-[#6B7280] italic mt-1">
                        {item.observacoes}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {pedido.observacoes && (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Observações
            </p>
            <p className="text-[13px] text-amber-900/90">{pedido.observacoes}</p>
          </section>
        )}

        <section className="rounded-md border border-[#E5E7EB] p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-1 flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            Pagamento
          </p>
          <Row label="Forma" value={pedido.meio_pagamento} />
          {pedido.troco_para != null && Number(pedido.troco_para) > 0 && (
            <Row
              label="Troco para"
              value={formatCurrency(pedido.troco_para)}
            />
          )}
          <div className="border-t border-[#E5E7EB] pt-2 space-y-1.5">
            <Row label="Subtotal" value={formatCurrency(pedido.subtotal)} />
            <Row
              label={delivery ? "Taxa de entrega" : "Taxa (retirada)"}
              value={formatCurrency(pedido.taxa_entrega)}
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[14px] font-semibold text-[#111827]">
                Total
              </span>
              <span className="text-[16px] font-bold text-[#111827] tabular-nums">
                {formatCurrency(pedido.total)}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-[#E5E7EB] p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-1">
            Histórico
          </p>
          <p className="text-[13px] text-[#374151]">
            Criado em{" "}
            {format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm", {
              locale: ptBR,
            })}
          </p>
          {pedido.updated_at !== pedido.created_at && (
            <p className="text-[13px] text-[#374151]">
              Atualizado em{" "}
              {format(new Date(pedido.updated_at), "dd/MM/yyyy HH:mm", {
                locale: ptBR,
              })}
            </p>
          )}
          <p className="text-[13px] text-[#6B7280]">
            Status atual: {meta.label}
          </p>
        </section>
      </div>

      {printTipo && <OrderPrint pedido={pedido} tipo={printTipo} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-medium text-[#111827] text-right capitalize">
        {value}
      </span>
    </div>
  );
}
