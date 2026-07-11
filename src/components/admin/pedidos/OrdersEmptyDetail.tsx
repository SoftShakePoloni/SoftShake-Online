"use client";

import { ShoppingBag, Keyboard } from "lucide-react";

export function OrdersEmptyDetail() {
  return (
    <div className="flex-1 h-full flex items-center justify-center bg-[#FAFBFC] min-w-0">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-[#4C258C]" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827] mb-1.5">
          Selecione um pedido
        </h3>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Escolha um pedido na lista ao lado para ver detalhes, itens e ações
          rápidas.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 text-[11px] text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5">
          <Keyboard className="w-3.5 h-3.5" />
          Enter aceita · Esc fecha
        </div>
      </div>
    </div>
  );
}
