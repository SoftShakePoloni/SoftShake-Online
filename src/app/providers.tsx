"use client";

import { CarrinhoProvider } from "@/context/CarrinhoContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <AuthProvider>
        <CarrinhoProvider>{children}</CarrinhoProvider>
      </AuthProvider>
  );
}
