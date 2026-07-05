"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useLoja } from "@/hooks/useLoja";
import { ModalInfoLoja } from "./ModalInfoLoja";

export function StoreHero() {
  const { loja } = useLoja();
  const [infoOpen, setInfoOpen] = useState(false);

  const nome = loja?.nome ?? "SoftShake";
  const cidade = loja?.cidade ?? "";
  const estado = loja?.estado ?? "";
  const localizacao = [cidade, estado].filter(Boolean).join(" - ");
  const banner = loja?.banner_url ?? null;
  const logo = loja?.logo_url ?? null;
  const estaAberto = loja?.esta_aberto ?? false;
  const horario = loja?.horario_abertura ? `Abrimos às ${loja.horario_abertura}` : "";

  return (
    <>
      <section>
        <div className="overflow-hidden rounded-2xl bg-muted">
          {banner ? (
            <Image
              src={banner}
              alt={`Banner ${nome}`}
              width={1600}
              height={640}
              className="h-40 w-full object-cover sm:h-56 md:h-72"
            />
          ) : (
            <div className="h-40 w-full bg-gradient-to-r from-primary/20 to-primary/10 sm:h-56 md:h-72" />
          )}
        </div>

        <div className="relative mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-end">
          <div className="-mt-12 sm:-mt-16 shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-card bg-card shadow-md sm:h-32 sm:w-32">
              {logo ? (
                <Image src={logo} alt={`${nome} logo`} width={128} height={128} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                  {nome.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{nome}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {estaAberto ? (
                <span className="font-semibold text-green-600">Aberto agora</span>
              ) : (
                <span className="font-semibold text-destructive">
                  Fechado{horario ? ` · ${horario}` : ""}
                </span>
              )}
              {localizacao && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {localizacao}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setInfoOpen(true)}
              className="mt-1 text-sm font-medium text-foreground hover:underline"
            >
              Mais informações
            </button>
          </div>
        </div>
      </section>

      <ModalInfoLoja open={infoOpen} onOpenChange={setInfoOpen} />
    </>
  );
}
