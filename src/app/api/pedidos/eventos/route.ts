import { obterSessao } from "@/lib/auth";
import { createServiceRoleClient } from "@/integrations/supabase/client.server";
import { customerOrderEvents } from "@/lib/customer-order-events.server";
import { apiUnauthorized } from "@/lib/security/api-response";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { withApiGuard } from "@/lib/security/with-api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.apiStrict, checkOrigin: false },
  async (request) => {
    const session = await obterSessao();
    if (!session) return apiUnauthorized();
    const raw =
      request.headers.get("last-event-id") ??
      new URL(request.url).searchParams.get("version") ??
      "";
    const version = /^[a-zA-Z0-9-]{1,100}$/.test(raw) ? raw : "";
    return customerOrderEvents(
      createServiceRoleClient(),
      session.id,
      version,
      request.signal,
    );
  },
);
