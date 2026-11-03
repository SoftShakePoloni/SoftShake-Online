"use client";

import { CarrinhoProvider } from "@/context/CarrinhoContext";
import { AuthProvider, type ClienteData } from "@/context/AuthContext";

export function Providers({
  children,
  initialCliente,
}: {
  children: React.ReactNode;
  initialCliente?: ClienteData | null;
}) {
  return (
    <AuthProvider initialCliente={initialCliente}>
      <CarrinhoProvider>{children}</CarrinhoProvider>
    </AuthProvider>
  );
}
