import { createServerClient } from "@/integrations/supabase/client.server";
import { imageProxyUrl } from "@/lib/image/proxy-url";
import { apiOk, apiServerError } from "@/lib/security/api-response";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { withApiGuard } from "@/lib/security/with-api-guard";

const CAMPOS_RESUMO = "id,nome,logo_url,banner_url,cidade,estado,horario_abertura,taxa_entrega,tempo_entrega_min,tempo_entrega_max,esta_aberto";

export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.apiStrict, checkOrigin: false },
  async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("configuracoes_loja")
        .select(CAMPOS_RESUMO)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return apiOk({ loja: null }, 200, { "Cache-Control": "no-store" });

      return apiOk({
        loja: {
          ...data,
          logo_url: imageProxyUrl(data.logo_url),
          banner_url: imageProxyUrl(data.banner_url),
        },
      }, 200, { "Cache-Control": "no-store" });
    } catch (error) {
      return apiServerError(error);
    }
  }
);
