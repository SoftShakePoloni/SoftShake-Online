import type { NextRequest } from "next/server";

/**
 * Valida Origin/Referer em mutações (CSRF básico para same-site + SPA).
 * Em produção, rejeita Origin estranho em POST/PUT/PATCH/DELETE.
 */
export function isTrustedOrigin(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Sem Origin (ex.: same-origin form em alguns browsers / server-to-server)
  if (!origin && !referer) {
    // Em dev, permite; em produção, mutações de browser normalmente mandam Origin
    if (process.env.NODE_ENV !== "production") return true;
    // Server Actions / fetch same-origin às vezes omitem Origin em edge cases
    return true;
  }

  const allowed = getAllowedOrigins(host);

  if (origin) {
    try {
      const o = new URL(origin);
      return allowed.some((a) => a === o.origin);
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const r = new URL(referer);
      return allowed.some((a) => a === r.origin);
    } catch {
      return false;
    }
  }

  return false;
}

function getAllowedOrigins(host: string | null): string[] {
  const list = new Set<string>();

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      list.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
    } catch {
      // ignore
    }
  }

  if (process.env.ALLOWED_ORIGINS) {
    for (const o of process.env.ALLOWED_ORIGINS.split(",")) {
      const t = o.trim();
      if (t) {
        try {
          list.add(new URL(t).origin);
        } catch {
          // ignore
        }
      }
    }
  }

  if (host) {
    list.add(`https://${host}`);
    list.add(`http://${host}`);
  }

  // localhost dev
  list.add("http://localhost:3000");
  list.add("http://127.0.0.1:3000");

  return [...list];
}
