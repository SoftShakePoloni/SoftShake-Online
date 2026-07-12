/**
 * Rate limiting por IP + bucket.
 *
 * - Padrão: Map em memória via globalThis (persiste no processo / isolate)
 * - Produção multi-instância: defina UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *
 * ⚠️ Map in-memory NÃO compartilha contadores entre:
 *   - Edge Middleware e Route Handlers (runtimes distintos)
 *   - Isolates serverless (Vercel cold starts / multi-região)
 * Por isso o middleware e o withApiGuard usam buckets distintos e, em produção,
 * Redis é a fonte da verdade.
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

/** Store no globalThis — evita reset em HMR / reimport do módulo no mesmo processo */
const globalForRl = globalThis as typeof globalThis & {
  __softshakeRateLimitStore?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  if (!globalForRl.__softshakeRateLimitStore) {
    globalForRl.__softshakeRateLimitStore = new Map();
  }
  return globalForRl.__softshakeRateLimitStore;
}

/** Limpa buckets expirados periodicamente (evita leak em long-running) */
function gc(now: number) {
  const store = getStore();
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

function memoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  gc(now);

  const store = getStore();
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

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Fixed window via Upstash REST (INCR + EXPIRE na 1ª contagem).
 * Funciona em Edge e multi-instância.
 */
async function upstashRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const redisKey = `rl:${config.bucket}:${key}`;
  const windowSec = config.windowSec;

  try {
    // Pipeline: INCR + TTL (para saber se precisa EXPIRE)
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PTTL", redisKey],
      ]),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[rate-limit] Upstash pipeline failed", res.status);
      return memoryRateLimit(key, config);
    }

    const data = (await res.json()) as { result: number }[];
    const count = Number(data?.[0]?.result ?? 0);
    let pttl = Number(data?.[1]?.result ?? -1);

    // Primeira vez na janela: define TTL
    if (pttl < 0 || count === 1) {
      await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["EXPIRE", redisKey, windowSec]]),
        cache: "no-store",
      });
      pttl = windowSec * 1000;
    }

    const reset = Date.now() + Math.max(pttl, 0);
    const success = count <= config.limit;
    const remaining = Math.max(0, config.limit - count);

    return {
      success,
      limit: config.limit,
      remaining,
      reset,
    };
  } catch (e) {
    console.error("[rate-limit] Upstash error, fallback memory", e);
    return memoryRateLimit(key, config);
  }
}

/**
 * Rate limit síncrono (apenas memória). Preferir `rateLimitCheck` nas rotas.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  return memoryRateLimit(key, config);
}

/**
 * Rate limit assíncrono: Upstash se configurado, senão memória.
 * Use este nas rotas e no middleware.
 */
export async function rateLimitCheck(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (hasUpstash()) {
    return upstashRateLimit(key, config);
  }
  return memoryRateLimit(key, config);
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

/** Reseta o store em memória (útil em testes). Não afeta Redis. */
export function __resetRateLimitStoreForTests() {
  getStore().clear();
}
