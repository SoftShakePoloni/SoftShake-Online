"use client";

import { Bell, Calendar } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PremiumTopbarProps {
  adminName: string;
  adminEmail?: string;
}

/** Título da página atual (exibido no topo em todas as rotas do admin) */
function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/pedidos")) return "Pedidos";
  if (
    pathname.startsWith("/admin/produtos") ||
    pathname.startsWith("/admin/categorias") ||
    pathname.startsWith("/admin/adicionais")
  ) {
    return "Catálogo";
  }
  if (pathname.startsWith("/admin/cupons")) return "Cupons";
  if (pathname.startsWith("/admin/clientes")) return "Clientes";
  if (pathname.startsWith("/admin/relatorios")) return "Relatórios";
  if (pathname.startsWith("/admin/financeiro")) return "Financeiro";
  if (pathname.startsWith("/admin/estabelecimento")) return "Estabelecimento";
  if (pathname.startsWith("/admin/configuracoes")) return "Configurações";
  return "Admin";
}

export function PremiumTopbar({ adminName }: PremiumTopbarProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";
  const pageTitle = getPageTitle(pathname);

  const currentDate = format(new Date(), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  useEffect(() => {
    if (!adminName) return;
    try {
      localStorage.setItem("softshake-admin-name", adminName);
    } catch {
      // ignore
    }
  }, [adminName]);

  return (
    <header
      data-admin-name={adminName}
      className="sticky top-0 z-40 h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <div className="flex items-center gap-3 min-w-0">
        {isDashboard ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-[#111827] shrink-0">
              Dashboard
            </h1>
            <span className="hidden sm:inline text-[#D1D5DB] text-lg">·</span>
            <div className="hidden sm:flex items-center gap-2 text-[15px] text-[#6B7280] min-w-0">
              <Calendar className="w-[18px] h-[18px] shrink-0 text-[#4C258C]/70" />
              <span className="capitalize truncate">{currentDate}</span>
            </div>
          </>
        ) : (
          <h1 className="text-xl font-semibold tracking-tight text-[#111827] truncate">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Sino de notificação só no Dashboard */}
      {isDashboard ? (
        <button
          type="button"
          aria-label="Notificações"
          className="relative w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#F7F8FC] text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
        </button>
      ) : (
        <div className="w-11" aria-hidden />
      )}
    </header>
  );
}
