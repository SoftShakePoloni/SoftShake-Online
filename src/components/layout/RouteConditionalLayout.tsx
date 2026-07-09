"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { BarraSacola } from "@/components/cardapio/BarraSacola";

export function RouteConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {!isAdminRoute && <Header />}
      {children}
      {!isAdminRoute && (
        <>
          <BarraSacola />
          <BottomNav />
        </>
      )}
    </div>
  );
}
