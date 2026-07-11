"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, ShoppingBag, User } from "lucide-react";
import type { ComponentType } from "react";
import { usePromocoesCount } from "@/hooks/useCardapio";
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

export function Header() {
  const pathname = usePathname();
  const { count: promosCount } = usePromocoesCount();

  return (
    <header className="hidden md:block bg-primary text-primary-foreground">
      <nav className="mx-auto flex max-w-6xl items-center justify-around px-6 py-3">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          const isPromos = item.to === "/promocoes";
          const showPromoBadge = isPromos && promosCount > 0;

          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-card text-primary shadow-sm"
                  : "text-primary-foreground/90 hover:text-primary-foreground"
              )}
            >
              <span className="relative">
                <Icon className="h-4 w-4" />
                {showPromoBadge && (
                  <span
                    className={cn(
                      "absolute -right-2.5 -top-2 min-w-[1.05rem] h-[1.05rem] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-primary animate-pulse"
                    )}
                  >
                    {promosCount > 9 ? "9+" : promosCount}
                  </span>
                )}
              </span>
              {item.label}
              {showPromoBadge && !active && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  novo
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
