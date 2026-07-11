"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  TicketPercent,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreStatusCard } from "./StoreStatusCard";

interface PremiumSidebarProps {
  adminEmail: string;
}

type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Badge opcional (ex.: "Em breve") */
  badge?: string;
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingBag,
  },
  {
    label: "Catálogo",
    href: "/admin/produtos",
    icon: Package,
  },
  {
    label: "Cupons",
    href: "/admin/cupons",
    icon: TicketPercent,
    badge: "Em breve",
  },
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: Users,
  },
  {
    label: "Relatórios",
    href: "/admin/relatorios",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
];

const ALL_HREFS = menuItems.map((item) => item.href);

function pathIsActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  // Catálogo também cobre rotas antigas redirecionadas
  if (href === "/admin/produtos") {
    return (
      pathname === "/admin/produtos" ||
      pathname.startsWith("/admin/produtos/") ||
      pathname.startsWith("/admin/categorias") ||
      pathname.startsWith("/admin/adicionais")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Precisa ser filho de <Link> para o Next sinalizar navegação em andamento. */
function SidebarLinkTrailing({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <Loader2
        className="w-4 h-4 shrink-0 animate-spin text-[#4C258C]"
        aria-hidden
      />
    );
  }

  if (active) {
    return <ChevronRight className="w-4 h-4 shrink-0 text-[#4C258C]" />;
  }

  return null;
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative",
        active
          ? "bg-[#EEE8FA] text-[#4C258C]"
          : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
      )}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#4C258C] rounded-r-full" />
      )}
      <Icon
        className={cn(
          "w-5 h-5 shrink-0",
          active ? "text-[#4C258C]" : "text-[#6B7280]"
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={cn(
            "text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0",
            active
              ? "bg-white/80 text-[#4C258C]"
              : "bg-amber-50 text-amber-700 border border-amber-100"
          )}
        >
          {badge}
        </span>
      )}
      <SidebarLinkTrailing active={active} />
    </Link>
  );
}

export function PremiumSidebar({ adminEmail }: PremiumSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const prefetchMenu = useCallback(() => {
    for (const href of ALL_HREFS) {
      try {
        router.prefetch(href);
      } catch {
        // ignore
      }
    }
  }, [router]);

  useEffect(() => {
    prefetchMenu();
    const ric = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number }
        ) => number;
      }
    ).requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric(() => prefetchMenu(), { timeout: 2000 });
      return () => {
        const cic = (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback;
        cic?.(id);
      };
    }
  }, [prefetchMenu]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[270px] bg-white border-r border-[#E5E7EB] flex flex-col z-50">
      <StoreStatusCard />

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Menu
        </p>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              active={pathIsActive(pathname, item.href)}
            />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C258C] to-[#7C3AED] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {adminEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#111827] truncate">
              Administrador
            </p>
            <p className="text-xs text-[#6B7280] truncate">{adminEmail}</p>
          </div>
        </div>
        <form action="/api/auth/admin/sair" method="POST" className="mt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
