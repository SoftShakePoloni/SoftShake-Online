"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  MapPin,
  Home,
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  ChevronDown,
  Package,
  ChefHat,
  Bike,
  CheckCircle2,
  XCircle,
  CircleDot,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/data/tipos";
import {
  extractComplementos,
  groupComplementos,
} from "@/lib/utils/pedido";
import {
  useClientePedidos,
  type ClientePedido,
} from "@/hooks/useClientePedidos";
import { Input } from "@/components/ui/input";

const STATUS_META: Record<
  string,
  { label: string; color: string; soft: string; step: number }
> = {
  pendente: {
    label: "Recebido",
    color: "bg-blue-500 text-white",
    soft: "bg-blue-50 text-blue-700 border-blue-200",
    step: 0,
  },
  preparando: {
    label: "Preparando",
    color: "bg-violet-500 text-white",
    soft: "bg-violet-50 text-violet-700 border-violet-200",
    step: 1,
  },
  saiu_entrega: {
    label: "Saiu para entrega",
    color: "bg-indigo-500 text-white",
    soft: "bg-indigo-50 text-indigo-700 border-indigo-200",
    step: 2,
  },
  entregue: {
    label: "Finalizado",
    color: "bg-emerald-500 text-white",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-200",
    step: 3,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-500 text-white",
    soft: "bg-red-50 text-red-700 border-red-200",
    step: -1,
  },
};

const TIMELINE = [
  { key: "pendente", label: "Recebido", icon: CircleDot },
  { key: "preparando", label: "Preparando", icon: ChefHat },
  { key: "saiu_entrega", label: "A caminho", icon: Bike },
  { key: "entregue", label: "Finalizado", icon: CheckCircle2 },
] as const;

type FilterKey = "todos" | "andamento" | "finalizados" | "cancelados";
type SortKey = "recentes" | "antigos" | "maior_valor";

function payIcon(meio: string) {
  const m = meio?.toLowerCase() || "";
  if (m.includes("pix")) return Smartphone;
  if (m.includes("dinheiro")) return Banknote;
  return CreditCard;
}

function isDelivery(tipo: string) {
  return tipo === "entrega" || tipo === "delivery";
}

function SkeletonCards() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-3xl bg-white border border-border animate-pulse"
        />
      ))}
    </div>
  );
}

function Timeline({ status }: { status: string }) {
  if (status === "cancelado") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
        <XCircle className="w-4 h-4 shrink-0" />
        Pedido cancelado
      </div>
    );
  }

  const current = STATUS_META[status]?.step ?? 0;

  return (
    <div className="w-full">
      {/* Mobile horizontal */}
      <div className="flex items-center justify-between gap-1 sm:hidden">
        {TIMELINE.map((step, i) => {
          const done = i <= current;
          const active = i === current;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      i <= current ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                    done
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-muted text-muted-foreground",
                    active && "ring-4 ring-primary/15 scale-110"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {i < TIMELINE.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      i < current ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Desktop vertical-ish horizontal with labels */}
      <div className="hidden sm:flex items-start justify-between gap-2">
        {TIMELINE.map((step, i) => {
          const done = i <= current;
          const active = i === current;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                    done
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted text-muted-foreground",
                    active && "ring-4 ring-primary/15"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < TIMELINE.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-full max-w-[48px] mt-5 rounded-full",
                    i < current ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PedidoCard({
  pedido,
  expanded,
  onToggle,
  isFlash,
}: {
  pedido: ClientePedido;
  expanded: boolean;
  onToggle: () => void;
  isFlash: boolean;
}) {
  const meta = STATUS_META[pedido.status] || STATUS_META.pendente;
  const PayIcon = payIcon(pedido.meio_pagamento);
  const delivery = isDelivery(pedido.tipo_entrega);
  const itemCount = pedido.itens?.reduce((s, i) => s + Number(i.qty || 1), 0) || 0;
  const end = pedido.endereco_completo;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isFlash ? [1, 1.015, 1] : 1,
      }}
      transition={{ duration: 0.35 }}
      className={cn(
        "bg-card rounded-3xl border border-border shadow-sm overflow-hidden transition-shadow",
        "hover:shadow-md hover:border-primary/20",
        isFlash && "ring-2 ring-primary/30 shadow-lg shadow-primary/10"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-5 sm:p-6"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-base sm:text-lg text-foreground">
                #{pedido.id.slice(0, 8).toUpperCase()}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  meta.soft
                )}
              >
                {meta.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(pedido.created_at), "dd MMM yyyy · HH:mm", {
                locale: ptBR,
              })}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
              {formatBRL(Number(pedido.total))}
            </p>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground ml-auto mt-1 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1">
            {delivery ? (
              <MapPin className="w-3.5 h-3.5" />
            ) : (
              <Home className="w-3.5 h-3.5" />
            )}
            {delivery ? "Entrega" : "Retirada"}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1 capitalize">
            <PayIcon className="w-3.5 h-3.5" />
            {pedido.meio_pagamento}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
        </div>

        <Timeline status={pedido.status} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-5 border-t border-border/80 bg-muted/30">
              <div className="pt-4 space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Itens do pedido
                </h4>
                {pedido.itens?.map((item, idx) => {
                  const grupos = groupComplementos(extractComplementos(item));
                  return (
                    <div
                      key={item.uid || idx}
                      className="rounded-2xl bg-card border border-border p-3.5 space-y-2"
                    >
                      <div className="flex justify-between gap-3">
                        <p className="font-semibold text-sm text-foreground">
                          <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 mr-1.5 rounded-md bg-primary/10 text-primary text-xs">
                            {item.qty}x
                          </span>
                          {item.produto?.name}
                        </p>
                        <p className="text-sm font-bold tabular-nums shrink-0">
                          {formatBRL(Number(item.total))}
                        </p>
                      </div>
                      {grupos.length > 0 && (
                        <div className="space-y-1.5 pl-2 border-l-2 border-primary/20">
                          {grupos.map((g, gi) => (
                            <div key={gi}>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                {g.groupName}
                              </p>
                              {g.items.map((c, ci) => (
                                <p
                                  key={ci}
                                  className="text-xs text-muted-foreground"
                                >
                                  + {c.name}
                                  {c.price > 0
                                    ? ` (${formatBRL(c.price)})`
                                    : ""}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.observacoes && (
                        <p className="text-xs italic text-muted-foreground bg-muted/60 rounded-lg px-2 py-1">
                          Obs: {item.observacoes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {delivery && end && (
                <div className="rounded-2xl bg-card border border-border p-3.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Entrega
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {typeof end === "string" ? (
                      end
                    ) : (
                      <>
                        {end.logradouro}
                        {end.numero ? `, ${end.numero}` : ""}
                        {end.complemento ? ` — ${end.complemento}` : ""}
                        <br />
                        {end.bairro}
                        {end.cidade ? ` · ${end.cidade}` : ""}
                        {end.estado ? `/${end.estado}` : ""}
                        {end.cep ? (
                          <>
                            <br />
                            CEP {end.cep}
                          </>
                        ) : null}
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-card border border-border p-3.5 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  Pagamento
                </h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {pedido.meio_pagamento}
                  </span>
                  <span className="font-medium">{meta.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatBRL(Number(pedido.subtotal))}</span>
                </div>
                {Number(pedido.taxa_entrega) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>{formatBRL(Number(pedido.taxa_entrega))}</span>
                  </div>
                )}
                {pedido.troco_para != null && Number(pedido.troco_para) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Troco para</span>
                    <span>{formatBRL(Number(pedido.troco_para))}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatBRL(Number(pedido.total))}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export function MeusPedidosView({
  clienteId,
}: {
  clienteId: string;
}) {
  const { pedidos, loading, error, flashIds } = useClientePedidos(clienteId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("todos");
  const [sort, setSort] = useState<SortKey>("recentes");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...pedidos];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.id.toLowerCase().includes(q));
    }

    if (filter === "andamento") {
      list = list.filter((p) =>
        ["pendente", "preparando", "saiu_entrega"].includes(p.status)
      );
    } else if (filter === "finalizados") {
      list = list.filter((p) => p.status === "entregue");
    } else if (filter === "cancelados") {
      list = list.filter((p) => p.status === "cancelado");
    }

    list.sort((a, b) => {
      if (sort === "antigos") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (sort === "maior_valor") {
        return Number(b.total) - Number(a.total);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [pedidos, search, filter, sort]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 pb-28">
          <div className="mb-6 h-10 w-48 rounded-xl bg-muted animate-pulse" />
          <SkeletonCards />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-primary/[0.04] to-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 pb-28">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Meus Pedidos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe tudo em tempo real
          </p>
        </header>

        {/* Search + filters */}
        <div className="space-y-3 mb-6 sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número do pedido..."
              className="h-12 pl-10 rounded-2xl bg-card border-border shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {(
              [
                ["todos", "Todos"],
                ["andamento", "Em andamento"],
                ["finalizados", "Finalizados"],
                ["cancelados", "Cancelados"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-semibold border transition-all",
                  filter === key
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {(
              [
                ["recentes", "Mais recentes"],
                ["antigos", "Mais antigos"],
                ["maior_valor", "Maior valor"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={cn(
                  "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors",
                  sort === key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && pedidos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center py-16 px-4"
          >
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -right-1 -bottom-1 w-10 h-10 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Você ainda não fez nenhum pedido.
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-8">
              Explore o cardápio e peça seu açaí ou milkshake favorito.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:opacity-95 transition"
            >
              Pedir agora
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-sm text-muted-foreground">
            Nenhum pedido encontrado com esses filtros.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                expanded={expanded === pedido.id}
                isFlash={flashIds.has(pedido.id)}
                onToggle={() =>
                  setExpanded((cur) =>
                    cur === pedido.id ? null : pedido.id
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
