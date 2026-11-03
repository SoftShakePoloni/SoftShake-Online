import { obterSessao } from "@/lib/auth";
import { createServerClient } from "@/integrations/supabase/client.server";
import {
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/security/api-response";
import { withApiGuard } from "@/lib/security/with-api-guard";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.apiStrict, checkOrigin: false },
  async () => {
    try {
      const session = await obterSessao();
      if (!session) return apiUnauthorized();
      const db = createServerClient();
      const [total, active] = await Promise.all([
        db
          .from("pedidos")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", session.id)
          .neq("status", "cancelado"),
        db
          .from("pedidos")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", session.id)
          .not("status", "in", "(entregue,cancelado)"),
      ]);
      if (total.error || active.error)
        return apiServerError(total.error || active.error);
      return apiOk(
        { count: total.count ?? 0, ativos: active.count ?? 0 },
        200,
        { "Cache-Control": "private, no-store", "X-Customer-Id": session.id },
      );
    } catch (error) {
      return apiServerError(error);
    }
  },
);
