"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCarrinho } from "@/context/CarrinhoContext";
import { formatBRL } from "@/data/tipos";
import { ModalSacola } from "./ModalSacola";

export function BarraSacola() {
  const { totalItens, subtotal } = useCarrinho();
  const [open, setOpen] = useState(false);

  if (totalItens === 0) return null;

  return (
    <>
      <div className="fixed bottom-16 inset-x-0 z-50 px-4 pb-2 md:bottom-4">
        <button
          onClick={() => setOpen(true)}
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
      </div>

      <ModalSacola open={open} onOpenChange={setOpen} />
    </>
  );
}
