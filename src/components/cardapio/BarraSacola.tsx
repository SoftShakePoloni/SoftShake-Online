"use client";

import { ShoppingBag, Store } from "lucide-react";
import { useState } from "react";
import { useCarrinho } from "@/context/CarrinhoContext";
import { formatBRL } from "@/data/tipos";
import { ModalSacola } from "./ModalSacola";
import { useLoja } from "@/hooks/useLoja";
import { toast } from "sonner";

export function BarraSacola() {
  const { totalItens, subtotal } = useCarrinho();
  const { loja, isLoading } = useLoja();
  const [open, setOpen] = useState(false);
  const lojaAberta = isLoading ? true : Boolean(loja?.esta_aberto);

  if (totalItens === 0) return null;

  const handleOpen = () => {
    if (!lojaAberta) {
      toast.error("Loja fechada", {
        description: "No momento não estamos aceitando pedidos.",
      });
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-16 inset-x-0 z-50 px-4 pb-2 md:bottom-4">
        {lojaAberta ? (
          <button
            onClick={handleOpen}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-95"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-bold">
                {totalItens}
              </span>
              <ShoppingBag className="h-4 w-4" />
              Ver sacola
            </span>
            <span>{formatBRL(subtotal)}</span>
          </button>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted border border-border px-4 py-3.5 text-sm font-semibold text-muted-foreground shadow-lg">
            <Store className="h-4 w-4" />
            Loja fechada — não é possível finalizar pedidos
          </div>
        )}
      </div>

      <ModalSacola open={open && lojaAberta} onOpenChange={setOpen} />
    </>
  );
}
