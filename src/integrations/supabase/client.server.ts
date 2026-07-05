import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const BUCKET = "SoftShake Images";
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hora em segundos

/**
 * Cliente Supabase com Service Role — use APENAS em Server Components,
 * Route Handlers e Server Actions. NUNCA importe em componentes client-side.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Variáveis de ambiente do Supabase (server) não configuradas.");
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Gera uma signed URL para um path no bucket privado.
 * Deve ser chamada APENAS no servidor.
 */
export async function getSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;

  const client = createServerClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error) {
    console.error("[getSignedUrl] erro:", error.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Gera signed URLs em lote para múltiplos paths.
 * Muito mais eficiente que chamar getSignedUrl em loop.
 */
export async function getSignedUrls(
  paths: string[],
): Promise<Map<string, string>> {
  const validPaths = paths.filter(Boolean);
  if (validPaths.length === 0) return new Map();

  const client = createServerClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrls(validPaths, SIGNED_URL_EXPIRY);

  if (error) {
    console.error("[getSignedUrls] erro:", error.message);
    return new Map();
  }

  return new Map(
    (data ?? [])
      .filter((item) => item.signedUrl && item.path)
      .map((item) => [item.path!, item.signedUrl!]),
  );
}
