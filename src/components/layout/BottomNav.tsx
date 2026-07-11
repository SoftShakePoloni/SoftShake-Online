"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { usePromocoesCount } from "@/hooks/useCardapio";
import { cn } from "@/lib/utils";

type Pedido = {
  status: string;
};

const items: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/promocoes", label: "Promoções", icon: Tag },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [pedidosAtivos, setPedidosAtivos] = useState(0);
  const { count: promosCount } = usePromocoesCount();

  useEffect(() => {
    const carregarPedidosAtivos = async () => {
      try {
        const resposta = await fetch("/api/pedidos/listar");
        if (resposta.ok) {
          const dados = await resposta.json();
          const ativos =
            dados.pedidos?.filter(
              (p: Pedido) => !["entregue", "cancelado"].includes(p.status)
            ).length || 0;
          setPedidosAtivos(ativos);
        }
      } catch {
        // ignore
      }
    };

    void carregarPedidosAtivos();
    const interval = setInterval(carregarPedidosAtivos, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          const isPedidos = item.to === "/pedidos";
          const isPromos = item.to === "/promocoes";

          return (
            <li key={item.to}>
              <Link
                href={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium relative transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isPromos && promosCount > 0 && !active && "text-primary"
                    )}
                  />
                  {isPedidos && pedidosAtivos > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pedidosAtivos > 9 ? "9+" : pedidosAtivos}
                    </span>
                  )}
                  {isPromos && promosCount > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-sm",
                        "bg-gradient-to-br from-[#4C258C] to-[#7C3AED]",
                        !active && "animate-pulse"
                      )}
                      aria-label={`${promosCount} promoções ativas`}
                    >
                      {promosCount > 9 ? "9+" : promosCount}
                    </span>
                  )}
                  {/* Ponto de atenção quando há promo e não está na página */}
                  {isPromos && promosCount > 0 && !active && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={cn(
                    isPromos && promosCount > 0 && !active && "text-primary font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
