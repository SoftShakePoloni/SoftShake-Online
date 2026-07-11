import { withApiGuard } from "@/lib/security/with-api-guard";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/security/api-response";
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
      if (!sessao) return apiUnauthorized();

      const supabase = createServerClient();
      const { data: clienteCompleto } = await supabase
        .from("clientes")
        .select(
          "id, nome, telefone, endereco, enderecos_adicionais, email, created_at"
        )
        .eq("id", sessao.id)
        .maybeSingle();

      return apiOk({
        autenticado: true,
        cliente: clienteCompleto || {
          id: sessao.id,
          nome: sessao.nome,
          telefone: sessao.telefone,
          endereco: sessao.endereco,
        },
      });
    } catch (erro) {
      return apiServerError(erro);
    }
  }
);
