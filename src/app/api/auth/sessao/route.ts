import { withApiGuard } from "@/lib/security/with-api-guard";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { apiOk, apiServerError } from "@/lib/security/api-response";
import { obterSessao } from "@/lib/auth";
import { createServerClient } from "@/integrations/supabase/client.server";

export const GET = withApiGuard(
  {
    methods: ["GET"],
    rateLimit: RATE_LIMITS.apiStrict,
    checkOrigin: false,
  },
  async () => {
    try {
      const sessao = await obterSessao();
      // Visitantes sem cookie têm uma sessão vazia, não uma falha HTTP.
      if (!sessao)
        return apiOk({ autenticado: false, cliente: null }, 200, {
          "Cache-Control": "private, no-store",
        });

      const supabase = createServerClient();
      const { data: clienteCompleto, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone, endereco, enderecos_adicionais")
        .eq("id", sessao.id)
        .maybeSingle();

      if (error) return apiServerError(error);
      return apiOk(
        {
          autenticado: Boolean(clienteCompleto),
          cliente: clienteCompleto ?? null,
        },
        200,
        { "Cache-Control": "private, no-store" },
      );
    } catch (erro) {
      return apiServerError(erro);
    }
  },
);
