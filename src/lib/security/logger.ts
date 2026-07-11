/**
 * Logs estruturados (JSON) — prontos para Sentry/Datadog no futuro.
 * Nunca logar tokens, senhas ou service role.
 */

export type SecurityEvent =
  | "auth.login.success"
  | "auth.login.fail"
  | "auth.register"
  | "auth.logout"
  | "auth.admin.denied"
  | "pedido.create"
  | "pedido.status"
  | "admin.action"
  | "rate_limit"
  | "security.blocked"
  | "upload"
  | "api.error";

type LogPayload = {
  event: SecurityEvent;
  level?: "info" | "warn" | "error";
  userId?: string | null;
  ip?: string | null;
  path?: string | null;
  result?: "ok" | "fail" | "denied";
  meta?: Record<string, unknown>;
};

function redact(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  const clone = { ...meta };
  for (const k of Object.keys(clone)) {
    const low = k.toLowerCase();
    if (
      low.includes("password") ||
      low.includes("token") ||
      low.includes("secret") ||
      low.includes("authorization") ||
      low.includes("cookie")
    ) {
      clone[k] = "[REDACTED]";
    }
  }
  return clone;
}

export function securityLog(payload: LogPayload) {
  const line = {
    ts: new Date().toISOString(),
    service: "softshake",
    level: payload.level ?? "info",
    event: payload.event,
    userId: payload.userId ?? null,
    ip: payload.ip ?? null,
    path: payload.path ?? null,
    result: payload.result ?? "ok",
    meta: redact(payload.meta),
  };

  const msg = JSON.stringify(line);
  if (payload.level === "error") console.error(msg);
  else if (payload.level === "warn") console.warn(msg);
  else console.info(msg);
}
