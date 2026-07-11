/**
 * Rate limiting in-memory (edge/serverless single instance).
 * Se UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN estiverem definidos,
 * o mesmo contrato pode ser trocado por Redis sem mudar as rotas.
 *
 * Limites por bucket (janela deslizante aproximada por fixed window).
 */

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

/** Limpa buckets expirados periodicamente (evita leak em long-running) */
function gc(now: number) {
  if (store.size < 5000) return;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

export type RateLimitConfig = {
  /** Identificador lógico: "auth:login", "api:pedidos" */
  bucket: string;
  /** Máximo de requests na janela */
  limit: number;
  /** Janela em segundos */
  windowSec: number;
};

/**
 * Presets por tipo de rota (OWASP: throttling por endpoint).
 */
export const RATE_LIMITS = {
  login: { bucket: "auth:login", limit: 5, windowSec: 60 },
  register: { bucket: "auth:register", limit: 3, windowSec: 60 },
  api: { bucket: "api:general", limit: 120, windowSec: 60 },
  apiStrict: { bucket: "api:strict", limit: 30, windowSec: 60 },
  checkout: { bucket: "api:checkout", limit: 10, windowSec: 60 },
  imagem: { bucket: "api:imagem", limit: 60, windowSec: 60 },
  admin: { bucket: "api:admin", limit: 100, windowSec: 60 },
  search: { bucket: "api:search", limit: 40, windowSec: 60 },
} as const satisfies Record<string, RateLimitConfig>;

export function getClientIp(request: Request): string {
  const h = request.headers;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-vercel-forwarded-for") ||
    "unknown"
  );
}

/**
 * Rate limit por IP + bucket.
 * Retorna success:false quando excedido.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  gc(now);

  const fullKey = `${config.bucket}:${key}`;
  const windowMs = config.windowSec * 1000;
  let bucket = store.get(fullKey);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(fullKey, bucket);
  }

  bucket.count += 1;

  const remaining = Math.max(0, config.limit - bucket.count);
  const success = bucket.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    reset: bucket.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    ...(result.success
      ? {}
      : {
          "Retry-After": String(
            Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
          ),
        }),
  };
}
