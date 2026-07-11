import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  RATE_LIMITS,
  getClientIp,
  rateLimit,
  rateLimitHeaders,
  type RateLimitConfig,
} from "./rate-limit";
import {
  apiForbidden,
  apiRateLimited,
  apiServerError,
  assertMethod,
} from "./api-response";
import { isTrustedOrigin } from "./origin";
import { securityLog } from "./logger";

type GuardOptions = {
  methods: string[];
  rateLimit?: RateLimitConfig;
  /** Exige Origin/Referer confiável em mutações */
  checkOrigin?: boolean;
};

type Handler = (
  request: NextRequest,
  ctx: { ip: string }
) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper para Route Handlers: método, rate limit, origin, erros seguros.
 */
export function withApiGuard(options: GuardOptions, handler: Handler) {
  return async (request: NextRequest) => {
    const ip = getClientIp(request);
    const path = request.nextUrl.pathname;

    try {
      const methodErr = assertMethod(request, options.methods);
      if (methodErr) return methodErr;

      if (options.checkOrigin !== false && !isTrustedOrigin(request)) {
        securityLog({
          event: "security.blocked",
          level: "warn",
          ip,
          path,
          result: "denied",
          meta: { reason: "origin" },
        });
        return apiForbidden("Origem da requisição não permitida");
      }

      const rlConfig = options.rateLimit ?? RATE_LIMITS.api;
      const rl = rateLimit(ip, rlConfig);
      const headers = rateLimitHeaders(rl);

      if (!rl.success) {
        securityLog({
          event: "rate_limit",
          level: "warn",
          ip,
          path,
          result: "denied",
          meta: { bucket: rlConfig.bucket },
        });
        return apiRateLimited(headers);
      }

      const res = await handler(request, { ip });

      // anexa rate limit headers na resposta
      const h = new Headers(res.headers);
      Object.entries(headers).forEach(([k, v]) => h.set(k, String(v)));
      return new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: h,
      });
    } catch (e) {
      securityLog({
        event: "api.error",
        level: "error",
        ip,
        path,
        result: "fail",
      });
      return apiServerError(e);
    }
  };
}
