"use client";

import { useState } from "react";
import { useModalHistory } from "@/hooks/useModalHistory";
import { StorageImage as Image } from "@/components/ui/storage-image";
import dynamic from "next/dynamic";
import { Bike, ChevronRight, MapPin, Store } from "lucide-react";
import { useLoja } from "@/hooks/useLoja";
import { formatBRL } from "@/data/tipos";
const ModalInfoLoja = dynamic(() =>
  import("./ModalInfoLoja").then((module) => module.ModalInfoLoja),
);

export function StoreHero() {
  const { loja, isLoading, error } = useLoja();
  const [infoOpen, setInfoOpen] = useState(false);
  useModalHistory(infoOpen, setInfoOpen);
  const nome = loja?.nome ?? "SoftShake";
  const localizacao = [loja?.cidade, loja?.estado].filter(Boolean).join(", ");
  const lojaConfirmada = !isLoading && !!loja && !error;
  const estaAberto = lojaConfirmada && loja!.esta_aberto;
  const estaFechado = lojaConfirmada && !loja!.esta_aberto;
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
              preset="storeBanner"
              src={banner}
              alt={`Capa de ${nome}`}
              fill
              priority
              fetchPriority="high"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-primary" aria-hidden="true" />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5"
            aria-hidden="true"
          />
          {estaFechado && (
            <div
              role="status"
              className="absolute inset-0 flex items-center gap-4 bg-black/65 px-6 pb-6 text-white sm:gap-5 sm:px-10"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/80 sm:h-16 sm:w-16">
                <Store
                  aria-hidden="true"
                  className="h-7 w-7"
                  strokeWidth={1.6}
                />
              </span>
              <div>
                <p className="text-xl font-semibold leading-tight sm:text-2xl">
                  Loja fechada
                </p>
                <p className="mt-1 text-sm text-white/95 sm:text-base">
                  {horario || "Não estamos aceitando pedidos agora."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 mx-2 -mt-8 rounded-[22px] border border-border/70 bg-card px-4 pb-3 pt-8 shadow-[0_10px_26px_rgba(31,20,43,0.11)] sm:mx-5 sm:px-6 sm:pb-4 sm:pt-9">
          <div className="absolute left-1/2 top-0 flex h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[3px] border-card bg-card shadow-md sm:h-[76px] sm:w-[76px]">
            {logo ? (
              <Image
                preset="storeLogo"
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
                {estaAberto && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Aberto agora
                  </span>
                )}
                {temMinimo && (
                  <>
                    {estaAberto && <span aria-hidden="true">·</span>}
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
      </section>

      {infoOpen && <ModalInfoLoja open={infoOpen} onOpenChange={setInfoOpen} />}
    </>
  );
}
