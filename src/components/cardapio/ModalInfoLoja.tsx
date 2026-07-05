"use client";

import Image from "next/image";
import { X, MapPin, Phone, Clock, Instagram, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLoja } from "@/hooks/useLoja";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ModalInfoLoja({ open, onOpenChange }: Props) {
  const { loja } = useLoja();

  if (!loja) return null;

  const localizacao = [loja.endereco, loja.cidade, loja.estado].filter(Boolean).join(", ");
  const horario = loja.horario_abertura && loja.horario_fechamento
    ? `${loja.horario_abertura} às ${loja.horario_fechamento}`
    : loja.horario_abertura ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col gap-0 overflow-hidden border-0 p-0 sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
        <DialogTitle className="sr-only">Informações da loja</DialogTitle>

        {/* Banner */}
        {loja.banner_url && (
          <div className="relative h-36 w-full shrink-0 overflow-hidden">
            <Image src={loja.banner_url} alt={loja.nome} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            {loja.logo_url && (
              <Image
                src={loja.logo_url}
                alt={loja.nome}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border-2 border-border object-cover"
              />
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">{loja.nome}</h2>
              {loja.descricao && (
                <p className="text-sm text-muted-foreground">{loja.descricao}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          <div className="h-px bg-border" />

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${loja.esta_aberto ? "bg-green-500" : "bg-red-500"}`} />
            <span className={`text-sm font-semibold ${loja.esta_aberto ? "text-green-600" : "text-destructive"}`}>
              {loja.esta_aberto ? "Aberto agora" : "Fechado no momento"}
            </span>
          </div>

          {/* Horário */}
          {(horario || loja.dias_funcionamento) && (
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Horário de funcionamento</p>
                {loja.dias_funcionamento && (
                  <p className="text-sm text-muted-foreground">{loja.dias_funcionamento}</p>
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
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Localização</p>
                <p className="text-sm text-muted-foreground">{localizacao}</p>
              </div>
            </div>
          )}

          {/* Telefone / WhatsApp */}
          {(loja.telefone || loja.whatsapp) && (
            <div className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Contato</p>
                {loja.telefone && (
                  <p className="text-sm text-muted-foreground">{loja.telefone}</p>
                )}
                {loja.whatsapp && (
                  <a
                    href={`https://wa.me/${loja.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Entrega */}
          <div className="flex gap-3">
            <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
              <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Redes sociais</p>
                {loja.instagram && (
                  <a
                    href={`https://instagram.com/${loja.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-pink-500 hover:underline"
                  >
                    {loja.instagram}
                  </a>
                )}
                {loja.facebook && (
                  <a
                    href={`https://facebook.com/${loja.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-500 hover:underline"
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
