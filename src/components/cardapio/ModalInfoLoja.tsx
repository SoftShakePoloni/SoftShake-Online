"use client";

import { useEffect, useRef, useState } from "react";
import { StorageImage as Image } from "@/components/ui/storage-image";
import { usePathname } from "next/navigation";
import { X, MapPin, Phone, Clock, Instagram, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLoja, type ConfiguracoesLoja } from "@/hooks/useLoja";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ModalInfoLoja({ open, onOpenChange }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { loja: resumo } = useLoja();
  const [detalhes, setDetalhes] = useState<Partial<ConfiguracoesLoja> | null>(null);
  const pathname = usePathname();
  const previousPathname=useRef(pathname);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || detalhes) return;
    let active = true;
    void fetch("/api/loja/detalhes", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as { detalhes: Partial<ConfiguracoesLoja> | null };
        return data.detalhes;
      })
      .then((data) => {
        if (active && data) setDetalhes(data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [open, detalhes]);

  useEffect(() => {
    if (previousPathname.current !== pathname && open) onOpenChange(false);
    previousPathname.current=pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const loja = resumo ? { ...resumo, ...detalhes } : null;
  if (!loja) return null;

  const localizacao = [loja.endereco, loja.cidade, loja.estado].filter(Boolean).join(", ");
  const dias = loja.dias_funcionamento?.split(",").map(day => day.trim()).filter(Boolean).join(", ");
  const horario = loja.horario_abertura && loja.horario_fechamento
    ? `${loja.horario_abertura} às ${loja.horario_fechamento}`
    : loja.horario_abertura ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose onOpenAutoFocus={event => { event.preventDefault(); returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; titleRef.current?.focus({ preventScroll: true }); }} onCloseAutoFocus={event => { if (returnFocusRef.current?.isConnected) { event.preventDefault(); returnFocusRef.current.focus({ preventScroll: true }); } }} overlayClassName="z-[80] max-md:bottom-0 motion-reduce:animate-none motion-reduce:duration-0" className="z-[90] motion-reduce:animate-none motion-reduce:duration-0 flex h-dvh max-h-dvh w-full max-w-md flex-col gap-0 overflow-hidden border-0 p-0 top-0 translate-y-0 rounded-none md:top-[50%] md:translate-y-[-50%] md:h-[85dvh] md:max-h-[85dvh] md:rounded-2xl">
        <DialogTitle className="sr-only">Informações da loja</DialogTitle>

        <DialogDescription className="sr-only">Endereço, funcionamento e contato da loja.</DialogDescription>
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 ref={titleRef} tabIndex={-1} className="font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary">Informações da loja</h2>
          <button type="button" aria-label="Fechar informações da loja" onClick={() => onOpenChange(false)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"><X aria-hidden="true" className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-6">
          <div className="flex items-start gap-3">
            {loja.logo_url && <Image src={loja.logo_url} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />}
            <div className="min-w-0"><h3 className="text-xl font-bold">{loja.nome}</h3>{loja.descricao && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{loja.descricao}</p>}</div>
          </div>
          <div className="h-px bg-border" />

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${loja.esta_aberto ? "bg-emerald-600" : "bg-red-500"}`} />
            <span className={`text-sm font-semibold ${loja.esta_aberto ? "text-emerald-700" : "text-destructive"}`}>
              {loja.esta_aberto ? "Aberto agora" : "Fechado no momento"}
            </span>
          </div>

          {/* Horário */}
          {(horario || loja.dias_funcionamento) && (
            <div className="flex gap-3">
              <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Horário de funcionamento</p>
                {loja.dias_funcionamento && (
                  <p className="text-sm text-muted-foreground">{dias}</p>
                )}
                {horario && (
                  <p className="text-sm text-muted-foreground">{horario}</p>
                )}
              </div>
            </div>
          )}

          {/* Endereço */}
          {localizacao && (
            <div className="flex gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Localização</p>
                <p className="text-sm text-muted-foreground">{localizacao}</p>
              </div>
            </div>
          )}

          {/* Telefone / WhatsApp */}
          {(loja.telefone || loja.whatsapp) && (
            <div className="flex gap-3">
              <Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Contato</p>
                {loja.telefone && (
                  <p className="text-sm text-muted-foreground">{loja.telefone}</p>
                )}
                {loja.whatsapp && (
                  <a
                    href={`https://wa.me/${loja.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-sm text-emerald-700 hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Entrega */}
          <div className="flex gap-3">
            <ShoppingBag aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Entrega</p>
              <p className="text-sm text-muted-foreground">
                Taxa: R$ {Number(loja.taxa_entrega).toFixed(2).replace(".", ",")}
              </p>
              {loja.tempo_entrega_min && loja.tempo_entrega_max && (
                <p className="text-sm text-muted-foreground">
                  Tempo estimado: {loja.tempo_entrega_min}–{loja.tempo_entrega_max} min
                </p>
              )}
              {Number(loja.pedido_minimo) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Pedido mínimo: R$ {Number(loja.pedido_minimo).toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
          </div>

          {/* Redes sociais */}
          {(loja.instagram || loja.facebook) && (
            <div className="h-px bg-border" />
          )}
          {(loja.instagram || loja.facebook) && (
            <div className="flex gap-3">
              <Instagram aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Redes sociais</p>
                {loja.instagram && (
                  <a
                    href={`https://instagram.com/${loja.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center text-sm text-primary hover:underline"
                  >
                    {loja.instagram}
                  </a>
                )}
                {loja.facebook && (
                  <a
                    href={`https://facebook.com/${loja.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center text-sm text-primary hover:underline"
                  >
                    {loja.facebook}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
