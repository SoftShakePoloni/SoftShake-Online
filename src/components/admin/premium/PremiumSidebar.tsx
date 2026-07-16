"use client";

import { useEffect, useCallback, useMemo } from "react";
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
  Store,
  LogOut,
  ChevronRight,
  ChevronLeft,
  TicketPercent,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreStatusCard } from "./StoreStatusCard";
import { supabase } from "@/integrations/supabase/client";
import type { AdminPageAccess } from "@/lib/security/rbac";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PremiumSidebarProps {
  adminEmail: string;
  adminName?: string;
  roleLabel?: string;
  acessos: AdminPageAccess[];
  canManageStore?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  access: AdminPageAccess;
  badge?: string;
  group?: string;
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    access: "dashboard",
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingBag,
    access: "pedidos",
  },
  {
    label: "Catálogo",
    href: "/admin/produtos",
    icon: Package,
    access: "catalogo",
  },
  {
    label: "Cupons",
    href: "/admin/cupons",
    icon: TicketPercent,
    access: "cupons",
    badge: "Em breve",
  },
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: Users,
    access: "clientes",
  },
  {
    label: "Relatórios",
    href: "/admin/relatorios",
    icon: BarChart3,
    access: "relatorios",
  },
  {
    label: "Estabelecimento",
    href: "/admin/estabelecimento",
    icon: Store,
    access: "estabelecimento",
    group: "config",
  },
  {
    label: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
    access: "configuracoes",
    group: "config",
  },
];

function pathIsActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
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
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: string;
  collapsed?: boolean;
}) {
  const link = (
    <Link
      href={href}
      prefetch
      scroll={false}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative",
        active
          ? "bg-[#EEE8FA] text-[#4C258C]"
          : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]",
        collapsed && "justify-center px-0"
      )}
    >
      {active && !collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#4C258C] rounded-r-full" />
      )}
      <Icon
        className={cn(
          "w-5 h-5 shrink-0",
          active ? "text-[#4C258C]" : "text-[#6B7280]"
        )}
      />
      {!collapsed && (
        <>
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
        </>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
        {badge ? ` · ${badge}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}

export function PremiumSidebar({
  adminEmail,
  adminName,
  roleLabel: roleName = "Usuário",
  acessos,
  canManageStore = false,
  collapsed = false,
  onToggleCollapsed,
}: PremiumSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const allowedItems = useMemo(
    () => menuItems.filter((item) => acessos.includes(item.access)),
    [acessos]
  );
  const mainItems = useMemo(
    () => allowedItems.filter((item) => !item.group),
    [allowedItems]
  );
  const configItems = useMemo(
    () => allowedItems.filter((item) => item.group === "config"),
    [allowedItems]
  );
  const canOpenConfig = acessos.includes("configuracoes");

  const prefetchMenu = useCallback(() => {
    for (const item of allowedItems) {
      try {
        router.prefetch(item.href);
      } catch {
        // ignore
      }
    }
  }, [router, allowedItems]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const displayName = adminName || adminEmail || "Usuário";
  const initial = (displayName.charAt(0) || "U").toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-[#E5E7EB] flex flex-col z-50 transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[270px]"
        )}
      >
        {/* Topo: seta para recolher/expandir */}
        <div
          className={cn(
            "relative shrink-0 border-b border-[#E5E7EB]",
            collapsed ? "h-12" : "h-12"
          )}
        >
          {!collapsed && (
            <div className="flex h-full items-center px-4 pr-12">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">
                  SoftShake
                </p>
                <p className="text-[10px] text-[#9CA3AF] truncate">Painel</p>
              </div>
            </div>
          )}
          {onToggleCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  className={cn(
                    "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] shadow-sm transition-colors hover:border-[#D4C4F0] hover:bg-[#F9F7FD] hover:text-[#4C258C]",
                    collapsed
                      ? "left-1/2 -translate-x-1/2"
                      : "right-3"
                  )}
                  aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {collapsed ? "Expandir menu" : "Recolher menu"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <StoreStatusCard
          canManageStore={canManageStore}
          canOpenConfig={canOpenConfig}
          collapsed={collapsed}
        />

        <nav
          className={cn(
            "flex-1 py-4 overflow-y-auto overflow-x-hidden",
            collapsed ? "px-2" : "px-4"
          )}
        >
          {mainItems.length > 0 && (
            <>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Menu
                </p>
              )}
              <div className="space-y-1">
                {mainItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    badge={item.badge}
                    collapsed={collapsed}
                    active={pathIsActive(pathname, item.href)}
                  />
                ))}
              </div>
            </>
          )}

          {configItems.length > 0 && (
            <>
              {!collapsed && (
                <p className="px-3 mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Configurações
                </p>
              )}
              {collapsed && <div className="my-3 mx-2 border-t border-[#E5E7EB]" />}
              <div className={cn("space-y-1", !collapsed && "mt-0")}>
                {configItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    badge={item.badge}
                    collapsed={collapsed}
                    active={pathIsActive(pathname, item.href)}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        <div
          className={cn(
            "border-t border-[#E5E7EB]",
            collapsed ? "p-2" : "p-4"
          )}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4C258C] to-[#7C3AED] flex items-center justify-center"
                title={`${displayName} · ${roleName}`}
              >
                <span className="text-white font-semibold text-xs">
                  {initial}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 transition-colors"
                    aria-label="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C258C] to-[#7C3AED] flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {initial}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-[#6B7280] truncate">
                    {roleName}
                    {adminEmail ? ` · ${adminEmail}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
