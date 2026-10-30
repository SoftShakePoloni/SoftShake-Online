import { createServerClient } from "@/integrations/supabase/client.server";
import { apiOk, apiServerError } from "@/lib/security/api-response";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { withApiGuard } from "@/lib/security/with-api-guard";

const CAMPOS_DETALHES = "descricao,endereco,telefone,whatsapp,instagram,facebook,horario_fechamento,dias_funcionamento,pedido_minimo";

export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.apiStrict, checkOrigin: false },
  async () => {
    try {
      const { data, error } = await createServerClient()
        .from("configuracoes_loja")
        .select(CAMPOS_DETALHES)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return apiOk({ detalhes: data ?? null });
    } catch (error) {
      return apiServerError(error);
    }
  }
);
