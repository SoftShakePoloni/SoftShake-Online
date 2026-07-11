import { withApiGuard } from "@/lib/security/with-api-guard";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  apiOk,
  apiServerError,
  apiUnauthorized,
} from "@/lib/security/api-response";
import { obterSessao } from "@/lib/auth";
import { createServerClient } from "@/integrations/supabase/client.server";
import {
  enrichPedidoItens,
  type OpcaoLookup,
  type GrupoLookup,
} from "@/lib/utils/pedido";

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

      const [{ data: pedidos, error }, { data: opcoes }, { data: grupos }] =
        await Promise.all([
          supabase
            .from("pedidos")
            .select("*")
            .eq("cliente_id", sessao.id)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("opcoes")
            .select(
              "id, nome, preco_adicional, grupo_id, grupo:grupos_opcoes(id, nome)"
            ),
          supabase.from("grupos_opcoes").select("id, nome"),
        ]);

      if (error) {
        return apiServerError(error);
      }

      const pedidosEnriquecidos = (pedidos || []).map((pedido) => ({
        ...pedido,
        itens: enrichPedidoItens(
          Array.isArray(pedido.itens) ? pedido.itens : [],
          (opcoes || []) as OpcaoLookup[],
          (grupos || []) as GrupoLookup[]
        ),
      }));

      return apiOk({ pedidos: pedidosEnriquecidos });
    } catch (e) {
      return apiServerError(e);
    }
  }
);
