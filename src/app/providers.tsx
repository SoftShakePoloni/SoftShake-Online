"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CarrinhoProvider } from "@/context/CarrinhoContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CarrinhoProvider>{children}</CarrinhoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
