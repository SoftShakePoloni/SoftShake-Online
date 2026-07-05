"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ConfiguracoesLoja = {
  id: number;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  banner_url: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  horario_abertura: string | null;
  horario_fechamento: string | null;
  dias_funcionamento: string | null;
  taxa_entrega: number;
  pedido_minimo: number;
  tempo_entrega_min: number | null;
  tempo_entrega_max: number | null;
  esta_aberto: boolean;
};

async function resolveImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  // Se já for uma URL completa, usa direto
  if (path.startsWith("http")) return path;
  // Caso contrário, pede a signed URL ao servidor
  try {
    const res = await fetch(`/api/imagem?path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

export function useLoja() {
  const [loja, setLoja] = useState<ConfiguracoesLoja | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLoja() {
      try {
        const { data } = await supabase
          .from("configuracoes_loja")
          .select("*")
          .limit(1)
          .single();

        if (!data) return;

        // Resolve as imagens pelo servidor (bucket privado)
        const [logoResolvida, bannerResolvido] = await Promise.all([
          resolveImageUrl(data.logo_url),
          resolveImageUrl(data.banner_url),
        ]);

        setLoja({
          ...(data as ConfiguracoesLoja),
          logo_url: logoResolvida,
          banner_url: bannerResolvido,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchLoja();
  }, []);

  return { loja, isLoading };
}
