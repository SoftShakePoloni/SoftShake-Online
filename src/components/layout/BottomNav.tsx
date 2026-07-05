"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

type Pedido = {
  status: string;
};

const items: { to: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/promocoes", label: "Promoções", icon: Tag },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [pedidosAtivos, setPedidosAtivos] = useState(0);

  useEffect(() => {
    const carregarPedidosAtivos = async () => {
      try {
        const resposta = await fetch('/api/pedidos/listar');
        if (resposta.ok) {
          const dados = await resposta.json();
          // Conta pedidos que não estão entregues ou cancelados
          const ativos = dados.pedidos?.filter((p: Pedido) => 
            !['entregue', 'cancelado'].includes(p.status)
          ).length || 0;
          setPedidosAtivos(ativos);
        }
      } catch {
        // Silently handle error
      }
    };

    carregarPedidosAtivos();
    
    // Atualiza a cada 30 segundos
    const interval = setInterval(carregarPedidosAtivos, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card md:hidden">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          const isPedidos = item.to === '/pedidos';
          
          return (
            <li key={item.to}>
              <Link
                href={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium relative ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {isPedidos && pedidosAtivos > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pedidosAtivos > 9 ? '9+' : pedidosAtivos}
                    </span>
                  )}
                </div>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
