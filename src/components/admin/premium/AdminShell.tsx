"use client";

import { useCallback, useEffect, useState } from "react";
import { PremiumSidebar } from "./PremiumSidebar";
import { PremiumTopbar } from "./PremiumTopbar";
import { cn } from "@/lib/utils";
import type { AdminPageAccess } from "@/lib/security/rbac";

const SIDEBAR_KEY = "softshake-admin-sidebar-collapsed";

interface AdminShellProps {
  adminEmail: string;
  adminName: string;
  roleLabel: string;
  acessos: AdminPageAccess[];
  canManageStore: boolean;
  children: React.ReactNode;
}

export function AdminShell({
  adminEmail,
  adminName,
  roleLabel,
  acessos,
  canManageStore,
  children,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY);
      if (raw === "1" || raw === "true") setCollapsed(true);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <div className="flex">
        <PremiumSidebar
          adminEmail={adminEmail}
          adminName={adminName}
          roleLabel={roleLabel}
          acessos={acessos}
          canManageStore={canManageStore}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
        <main
          className={cn(
            "flex-1 min-h-screen flex flex-col transition-[margin] duration-300 ease-in-out",
            // evita “pulo” de layout antes de hidratar preferência
            !hydrated && "ml-[270px]",
            hydrated && (collapsed ? "ml-[72px]" : "ml-[270px]")
          )}
        >
          <PremiumTopbar adminName={adminName} adminEmail={adminEmail} />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
