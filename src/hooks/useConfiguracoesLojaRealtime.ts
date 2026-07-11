"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeConfiguracao,
  type ConfiguracaoLoja,
} from "@/types/configuracoes";

export type ConfiguracoesRealtimeStatus = "connecting" | "live" | "error";

async function resolveImageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const res = await fetch(`/api/imagem?path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

async function hydrateConfig(
  raw: Record<string, unknown>
): Promise<ConfiguracaoLoja> {
  const base = normalizeConfiguracao(raw);
  const [logo, banner] = await Promise.all([
    resolveImageUrl(base.logo_url),
    resolveImageUrl(base.banner_url),
  ]);
  return {
    ...base,
    logo_url: logo,
    banner_url: banner,
  };
}

/**
 * Snapshot + Realtime da tabela `configuracoes_loja`.
 */
export function useConfiguracoesLojaRealtime(
  inicial?: ConfiguracaoLoja | null
) {
  const [config, setConfig] = useState<ConfiguracaoLoja | null>(
    () => inicial ?? null
  );
  const [loading, setLoading] = useState(!inicial);
  const [status, setStatus] =
    useState<ConfiguracoesRealtimeStatus>("connecting");

  const supabase = createClient();

  const applyRaw = useCallback(async (raw: Record<string, unknown>) => {
    const hydrated = await hydrateConfig(raw);
    setConfig(hydrated);
  }, []);

  const patchConfig = useCallback((patch: Partial<ConfiguracaoLoja>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const replaceConfig = useCallback((next: ConfiguracaoLoja) => {
    setConfig(next);
  }, []);

  // Fetch inicial se não veio do SSR
  useEffect(() => {
    if (inicial) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("configuracoes_loja")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (error || !data) {
          setLoading(false);
          return;
        }
        await applyRaw(data as Record<string, unknown>);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inicial, supabase, applyRaw]);

  // Realtime
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel("admin-configuracoes-loja")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "configuracoes_loja",
        },
        (payload) => {
          const row =
            payload.eventType === "DELETE"
              ? null
              : (payload.new as Record<string, unknown> | null);
          if (row && row.id != null) {
            void applyRaw(row);
          }
        }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("live");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED")
          setStatus("error");
        else setStatus("connecting");
      });

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [supabase, applyRaw]);

  return {
    config,
    loading,
    status,
    patchConfig,
    replaceConfig,
    setConfig,
  };
}
