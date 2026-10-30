"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { usePromocoesCount } from "@/hooks/useCardapio";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const [pedidosAtivos, setPedidosAtivos] = useState(0);
  const { count: promosCount } = usePromocoesCount();
  const { cliente, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!cliente) {
      setPedidosAtivos(0);
      return;
    }

    const carregarPedidosAtivos = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const resposta = await fetch("/api/pedidos/ativos", {
          cache: "no-store",
        });
        if (resposta.ok) {
          const dados = await resposta.json();
          setPedidosAtivos(Number(dados.count) || 0);
        }
      } catch {
        // ignore
      }
    };

    void carregarPedidosAtivos();
    const interval = setInterval(carregarPedidosAtivos, 60000);
    return () => clearInterval(interval);
  }, [cliente, loading]);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[70] border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      aria-label="Navegação principal"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = isActivePath(pathname, item.to);
          const Icon = item.icon;
          const isPedidos = item.to === "/pedidos";
          const isPromos = item.to === "/promocoes";

          return (
            <li key={item.to}>
              <Link
                href={item.to}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "min-h-[60px] flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium relative transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isPromos && promosCount > 0 && !active && "text-primary",
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
                        "bg-[#4C258C]",
                      )}
                      aria-label={`${promosCount} promoções ativas`}
                    >
                      {promosCount > 9 ? "9+" : promosCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    isPromos &&
                      promosCount > 0 &&
                      !active &&
                      "text-primary font-semibold",
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
