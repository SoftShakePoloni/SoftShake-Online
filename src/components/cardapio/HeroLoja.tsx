"use client";

import { useState } from "react";
import Image from "next/image";
import { Bike, ChevronRight, MapPin } from "lucide-react";
import { useLoja } from "@/hooks/useLoja";
import { formatBRL } from "@/data/tipos";
import { ModalInfoLoja } from "./ModalInfoLoja";

export function StoreHero() {
  const { loja, isLoading } = useLoja();
  const [infoOpen, setInfoOpen] = useState(false);
  const nome = loja?.nome ?? "SoftShake";
  const localizacao = [loja?.cidade, loja?.estado].filter(Boolean).join(", ");
  const estaAberto = isLoading ? true : (loja?.esta_aberto ?? false);
  const banner = loja?.banner_url ?? null;
  const logo = loja?.logo_url ?? null;
  const minimo = Number(loja?.pedido_minimo ?? 0);
  const temMinimo = minimo > 0;
  const minTempo = loja?.tempo_entrega_min;
  const maxTempo = loja?.tempo_entrega_max;
  const tempoEntrega =
    minTempo != null && maxTempo != null ? `${minTempo}–${maxTempo} min` : null;
  const taxaEntrega = Number(loja?.taxa_entrega ?? 0);
  const horario = loja?.horario_abertura
    ? `Abre às ${loja.horario_abertura}`
    : null;

  return (
    <>
      <section className="relative pb-1">
        <div className="relative h-40 overflow-hidden rounded-t-[26px] bg-primary/15 sm:h-52 md:h-64">
          {banner ? (
            <Image
              src={banner}
              alt={`Capa de ${nome}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1152px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-primary" aria-hidden="true" />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5"
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 mx-2 -mt-8 rounded-[22px] border border-border/70 bg-card px-4 pb-3 pt-8 shadow-[0_10px_26px_rgba(31,20,43,0.11)] sm:mx-5 sm:px-6 sm:pb-4 sm:pt-9">
          <div className="absolute left-1/2 top-0 flex h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[3px] border-card bg-card shadow-md sm:h-[76px] sm:w-[76px]">
            {logo ? (
              <Image
                src={logo}
                alt={`Logo de ${nome}`}
                fill
                sizes="76px"
                className="object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {nome.charAt(0)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="group flex w-full touch-manipulation items-center justify-between gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
            aria-label={`Ver informações de ${nome}`}
          >
            <span className="min-w-0">
              <span className="block truncate text-pretty text-[20px] font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-[22px]">
                {nome}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${estaAberto ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
                  />
                  <span
                    className={estaAberto ? "font-medium text-emerald-700" : ""}
                  >
                    {estaAberto
                      ? "Aberto agora"
                      : `Fechado${horario ? ` · ${horario}` : ""}`}
                  </span>
                </span>
                {temMinimo && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Mínimo {formatBRL(minimo)}</span>
                  </>
                )}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>

          {(localizacao || tempoEntrega || loja?.taxa_entrega != null) && (
            <>
              <div className="my-3 h-px bg-border/80" />

              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="flex w-full touch-manipulation items-center gap-3 rounded-xl py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                aria-label="Ver localização e informações da loja"
              >
                <MapPin
                  aria-hidden="true"
                  className="h-[18px] w-[18px] shrink-0 text-primary"
                />
                <span className="min-w-0 flex-1 text-[13px] font-medium text-foreground sm:text-sm">
                  {localizacao || "Informações da loja"}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
              </button>

              {(tempoEntrega || loja?.taxa_entrega != null) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/70 pt-2.5 text-[12px] text-muted-foreground sm:text-[13px]">
                  <span className="inline-flex items-center gap-1.5">
                    <Bike aria-hidden="true" className="h-3.5 w-3.5" />
                    Entrega
                  </span>
                  {tempoEntrega && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{tempoEntrega}</span>
                    </>
                  )}
                  {loja?.taxa_entrega != null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          taxaEntrega === 0
                            ? "font-semibold text-emerald-700"
                            : "font-medium text-foreground"
                        }
                      >
                        {taxaEntrega === 0 ? "Grátis" : formatBRL(taxaEntrega)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!estaAberto && (
          <div
            role="status"
            className="mx-2 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-5"
          >
            <p className="font-semibold">Loja fechada no momento</p>
            <p className="mt-0.5 text-red-700/90">
              Não estamos aceitando pedidos agora.
              {horario ? ` ${horario}.` : " Volte mais tarde."}
            </p>
          </div>
        )}
      </section>

      <ModalInfoLoja open={infoOpen} onOpenChange={setInfoOpen} />
    </>
  );
}
