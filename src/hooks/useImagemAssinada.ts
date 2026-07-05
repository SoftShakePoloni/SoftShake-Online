"use client";

import { useState, useEffect } from "react";

/**
 * Hook que busca uma signed URL para um path no bucket privado,
 * passando pelo Route Handler /api/imagem (server-side, seguro).
 */
export function useImagemAssinada(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    // Se já for uma URL completa (ex: durante desenvolvimento), usa direto
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }

    let cancelled = false;

    fetch(`/api/imagem?path=${encodeURIComponent(path)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.url) setUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
