import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  RATE_LIMITS,
  getClientIp,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "X-DNS-Prefetch-Control": "on",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  // CSP: ajustável via env; default razoável para Next + Supabase
  "Content-Security-Policy":
    process.env.CONTENT_SECURITY_POLICY ||
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
};

function applySecurityHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return res;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem env, não quebra dev local hardcodado legado — mas avisa
  if (!supabaseUrl || !supabaseAnon) {
    console.warn("[security] Supabase env vars ausentes no middleware");
  }

  const supabase = createServerClient(
    supabaseUrl || "",
    supabaseAnon || "",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
            httpOnly: options.httpOnly ?? true,
            secure:
              process.env.NODE_ENV === "production"
                ? true
                : (options.secure ?? false),
            sameSite: options.sameSite ?? "lax",
            path: options.path ?? "/",
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const ip = getClientIp(request);

  // Rate limit em rotas de auth de cliente
  if (
    path.startsWith("/api/auth/entrar") ||
    path.startsWith("/api/auth/registrar")
  ) {
    const cfg = path.includes("registrar")
      ? RATE_LIMITS.register
      : RATE_LIMITS.login;
    const rl = rateLimit(ip, cfg);
    if (!rl.success) {
      const res = NextResponse.json(
        { erro: "Muitas tentativas. Aguarde e tente novamente." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
      return applySecurityHeaders(res);
    }
  }

  // Rate limit genérico em /api/*
  if (path.startsWith("/api/") && !path.startsWith("/api/auth/")) {
    const rl = rateLimit(ip, RATE_LIMITS.api);
    if (!rl.success) {
      const res = NextResponse.json(
        { erro: "Muitas requisições. Tente novamente em instantes." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
      return applySecurityHeaders(res);
    }
  }

  // Admin: exige usuário Supabase Auth (exceto login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      return applySecurityHeaders(NextResponse.redirect(redirectUrl));
    }
  }

  // Bloqueia APIs admin sem sessão Supabase
  if (
    path.startsWith("/api/pedidos/atualizar-status") ||
    path.startsWith("/api/admin")
  ) {
    if (!user) {
      return applySecurityHeaders(
        NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
      );
    }
  }

  if (path === "/admin/login" && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  return applySecurityHeaders(response);
}
