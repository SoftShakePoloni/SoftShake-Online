"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, Package, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/data/tipos";
import {
  useClientePedidos,
  type ClientePedido,
} from "@/hooks/useClientePedidos";

function SkeletonCards() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-3xl bg-white border border-border animate-pulse motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function PedidoCard({
  pedido,
  isFlash,
  active,
}: {
  pedido: ClientePedido;
  isFlash: boolean;
  active: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const primeiroItem = pedido.itens?.[0];

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isFlash && !reduceMotion ? [1, 1.015, 1] : 1,
      }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#E7E1EB] bg-white transition-colors hover:border-[#CBB9DD]",
        isFlash && "ring-2 ring-primary/30 shadow-lg shadow-primary/10",
      )}
    >
      <Link
        href={`/pedidos/${pedido.id}`}
        className="block rounded-[20px] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6B3FA0] sm:p-5"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F1EAF8] text-[#432078]">
            {primeiroItem?.produto?.image ? (
              <img
                src={primeiroItem.produto.image}
                alt={primeiroItem.produto.name || ""}
                width={56}
                height={56}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <ShoppingBag aria-hidden="true" className="h-6 w-6" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[#21172D]">
              {primeiroItem?.produto?.name || "Seu pedido"}
            </span>
            <span className="mt-0.5 block text-xs text-[#7B668C]">
              #{pedido.id.slice(0, 8).toUpperCase()} ·{" "}
              {format(new Date(pedido.created_at), "dd 'de' MMM", {
                locale: ptBR,
              })}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[15px] font-semibold tabular-nums text-[#21172D]">
              {formatBRL(Number(pedido.total))}
            </span>
          </span>
        </div>
        <span className="mt-4 flex items-center justify-end gap-1 text-sm font-medium text-[#432078]">
          {active ? "Acompanhar pedido" : "Ver detalhes"}
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </Link>
    </motion.article>
  );
}

export function MeusPedidosView({ clienteId }: { clienteId: string }) {
  const reduceMotion = useReducedMotion();
  const { pedidos, loading, error, flashIds } = useClientePedidos(clienteId);
  const ordenados = useMemo(
    () =>
      [...pedidos].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [pedidos],
  );
  const emAndamento = ordenados.filter((pedido) =>
    ["pendente", "confirmado", "preparando", "saiu_entrega"].includes(
      pedido.status,
    ),
  );
  const anteriores = ordenados.filter(
    (pedido) =>
      !["pendente", "confirmado", "preparando", "saiu_entrega"].includes(
        pedido.status,
      ),
  );

  if (loading) {
    return (
      <main id="conteudo-principal" className="min-h-[70vh] bg-[#FAF9FC]">
        <div className="mx-auto max-w-2xl px-4 py-8 pb-28 sm:px-6">
          <div className="mb-6 h-10 w-48 rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
          <SkeletonCards />
        </div>
      </main>
    );
  }

  return (
    <>
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-[#432078] focus:shadow-lg"
      >
        Pular para o conteúdo principal
      </a>
      <main
        id="conteudo-principal"
        className="min-h-[70vh] bg-[#FAF9FC] text-[#21172D]"
      >
        <div className="mx-auto max-w-2xl px-4 py-7 pb-28 sm:px-6 sm:py-9">
          <header className="mb-7">
            <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#21172D] sm:text-3xl">
              Meus pedidos
            </h1>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && pedidos.length === 0 ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: reduceMotion ? 0 : 0.2 },
              }}
              className="flex flex-col items-center text-center py-16 px-4"
            >
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <ShoppingBag
                    className="w-12 h-12 text-primary"
                    strokeWidth={1.5}
                  />
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
          ) : (
            <div className="space-y-8">
              {emAndamento.length > 0 && (
                <section aria-labelledby="pedidos-em-andamento">
                  <h2
                    id="pedidos-em-andamento"
                    className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B668C]"
                  >
                    Em andamento
                  </h2>
                  <div className="space-y-3">
                    {emAndamento.map((pedido) => (
                      <PedidoCard
                        key={pedido.id}
                        pedido={pedido}
                        isFlash={flashIds.has(pedido.id)}
                        active
                      />
                    ))}
                  </div>
                </section>
              )}
              {anteriores.length > 0 && (
                <section aria-labelledby="pedidos-anteriores">
                  <h2
                    id="pedidos-anteriores"
                    className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B668C]"
                  >
                    Anteriores
                  </h2>
                  <div className="divide-y divide-[#E7E1EB] overflow-hidden rounded-[20px] border border-[#E7E1EB] bg-white">
                    {anteriores.map((pedido) => (
                      <PedidoCard
                        key={pedido.id}
                        pedido={pedido}
                        isFlash={flashIds.has(pedido.id)}
                        active={false}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
