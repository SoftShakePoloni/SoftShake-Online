"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CarrinhoProvider } from "@/context/CarrinhoContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache por 5 minutos - evita requests desnecessários
        staleTime: 5 * 60 * 1000,
        // Mantém cache por 10 minutos
        gcTime: 10 * 60 * 1000,
        // Desabilita refetch automático ao focar na janela
        refetchOnWindowFocus: false,
        // Usa cache ao montar componentes
        refetchOnMount: false,
        // Apenas 1 retry em caso de erro
        retry: 1,
        // Evita refetch em reconexão
        refetchOnReconnect: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CarrinhoProvider>{children}</CarrinhoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
