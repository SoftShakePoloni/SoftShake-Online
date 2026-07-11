import { NextRequest } from "next/server";
import { z } from "zod";
import { obterSessao } from "@/lib/auth";
import { createServerClient } from "@/integrations/supabase/client.server";
import {
  enrichPedidoItens,
  type OpcaoLookup,
  type GrupoLookup,
} from "@/lib/utils/pedido";
import { withApiGuard } from "@/lib/security/with-api-guard";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  apiError,
  apiOk,
  apiServerError,
  apiUnauthorized,
  apiValidation,
} from "@/lib/security/api-response";
import { sanitizePhone, sanitizeText } from "@/lib/security/sanitize";
import { securityLog } from "@/lib/security/logger";

const criarPedidoSchema = z.object({
  cliente_nome: z
    .string()
    .min(2)
    .max(120)
    .transform((s) => sanitizeText(s, 120)),
  cliente_telefone: z
    .string()
    .min(10)
    .max(20)
    .transform((s) => sanitizePhone(s)),
  tipo_entrega: z.enum(["entrega", "delivery", "retirada", "mesa"]),
  endereco_id: z.string().max(64).optional().nullable(),
  endereco_completo: z.unknown().optional().nullable(),
  meio_pagamento: z
    .string()
    .min(2)
    .max(40)
    .transform((s) => sanitizeText(s, 40)),
  troco_para: z.union([z.string(), z.number()]).optional().nullable(),
  subtotal: z.number().min(0).max(100_000),
  taxa_entrega: z.number().min(0).max(1_000),
  total: z.number().min(0).max(100_000),
  itens: z.array(z.record(z.string(), z.unknown())).min(1).max(50),
  observacoes: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((s) => (s ? sanitizeText(s, 500) : null)),
});

export const POST = withApiGuard(
  {
    methods: ["POST"],
    rateLimit: RATE_LIMITS.checkout,
    checkOrigin: true,
  },
  async (request: NextRequest, { ip }) => {
    try {
      const sessao = await obterSessao();
      if (!sessao) return apiUnauthorized();

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return apiValidation("Corpo da requisição inválido");
      }

      const parsed = criarPedidoSchema.safeParse(body);
      if (!parsed.success) {
        return apiValidation("Dados do pedido inválidos");
      }

      const data = parsed.data;

      if (
        (data.tipo_entrega === "entrega" || data.tipo_entrega === "delivery") &&
        !data.endereco_completo
      ) {
        return apiValidation("Endereço é obrigatório para entrega");
      }

      // Sanitiza nome no endereço se string
      let enderecoCompleto = data.endereco_completo;
      if (typeof enderecoCompleto === "string") {
        enderecoCompleto = sanitizeText(enderecoCompleto, 500);
      }

      const supabase = createServerClient();

      type ConfigRow = {
        esta_aberto?: boolean | null;
        aceitar_pedidos_automaticamente?: boolean | null;
        aceitando_pedidos?: boolean | null;
      };

      let configLoja: ConfigRow | null = null;
      {
        const full = await supabase
          .from("configuracoes_loja")
          .select(
            "esta_aberto, aceitar_pedidos_automaticamente, aceitando_pedidos"
          )
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!full.error && full.data) {
          configLoja = full.data as ConfigRow;
        } else {
          const basic = await supabase
            .from("configuracoes_loja")
            .select("esta_aberto, aceitar_pedidos_automaticamente")
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (!basic.error && basic.data) {
            configLoja = basic.data as ConfigRow;
          }
        }
      }

      if (configLoja) {
        const lojaAberta = configLoja.esta_aberto !== false;
        const aceitando =
          configLoja.aceitando_pedidos !== undefined &&
          configLoja.aceitando_pedidos !== null
            ? Boolean(configLoja.aceitando_pedidos)
            : lojaAberta;

        if (!lojaAberta || !aceitando) {
          return apiError(
            "A loja está fechada no momento e não está aceitando pedidos.",
            403,
            { codigo: "STORE_CLOSED" }
          );
        }
      }

      const [{ data: opcoes }, { data: grupos }] = await Promise.all([
        supabase
          .from("opcoes")
          .select(
            "id, nome, preco_adicional, grupo_id, grupo:grupos_opcoes(id, nome)"
          ),
        supabase.from("grupos_opcoes").select("id, nome"),
      ]);

      const itensEnriquecidos = enrichPedidoItens(
        data.itens as never[],
        (opcoes || []) as OpcaoLookup[],
        (grupos || []) as GrupoLookup[]
      ).map((item) => ({
        ...item,
        adicionais: item.adicionais || item.selectionsResolved || [],
      }));

      const autoAceite = Boolean(configLoja?.aceitar_pedidos_automaticamente);
      const initialStatus: "pendente" | "preparando" = autoAceite
        ? "preparando"
        : "pendente";

      const { data: pedido, error } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: sessao.id,
          cliente_nome: data.cliente_nome,
          cliente_telefone: data.cliente_telefone,
          tipo_entrega: data.tipo_entrega,
          endereco_id: data.endereco_id,
          endereco_completo: enderecoCompleto as never,
          meio_pagamento: data.meio_pagamento,
          troco_para: data.troco_para != null ? String(data.troco_para) : null,
          subtotal: data.subtotal,
          taxa_entrega: data.taxa_entrega,
          total: data.total,
          itens: itensEnriquecidos,
          status: initialStatus,
          observacoes: data.observacoes,
        })
        .select("id, status, total, created_at")
        .single();

      if (error || !pedido) {
        return apiServerError(error);
      }

      securityLog({
        event: "pedido.create",
        ip,
        userId: sessao.id,
        path: "/api/pedidos/criar",
        result: "ok",
        meta: { pedidoId: pedido.id, total: pedido.total },
      });

      return apiOk(
        {
          mensagem: "Pedido criado com sucesso",
          pedido,
          auto_aceito: autoAceite,
        },
        201
      );
    } catch (erro) {
      return apiServerError(erro);
    }
  }
);
