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
import { getSaoPauloDateTime, isFreteCampaignActive } from "@/lib/promocoes/frete";
import { validarCupom } from "@/lib/cupons";

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
  cupom_codigo: z.string().max(32).optional().nullable(),
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

      if (data.cupom_codigo) {
        try {
          await validarCupom(data.cupom_codigo, data.subtotal);
        } catch (error) {
          return apiError(error instanceof Error ? error.message : "Cupom inválido.", 400);
        }
      }

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
        taxa_entrega?: number | null;
      };

      let configLoja: ConfigRow | null = null;
      {
        const full = await supabase
          .from("configuracoes_loja")
          .select(
            "esta_aberto, aceitar_pedidos_automaticamente, aceitando_pedidos, taxa_entrega"
          )
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!full.error && full.data) {
          configLoja = full.data as ConfigRow;
        } else {
          const basic = await supabase
            .from("configuracoes_loja")
            .select("esta_aberto, aceitar_pedidos_automaticamente, taxa_entrega")
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

      const comboIds = [...new Set(data.itens.flatMap((raw) => {
        const item = raw as { produto?: { comboId?: unknown; id?: unknown }; qty?: unknown; total?: unknown };
        const comboId = Number(item.produto?.comboId);
        return Number.isInteger(comboId) && comboId > 0 ? [comboId] : [];
      }))];
      let comboLinks: { combo_id: number; produto_id: number }[] = [];
      if (comboIds.length) {
        const { data: activeCombos, error: comboError } = await supabase
          .from("combos")
          .select("id, preco, ativa")
          .in("id", comboIds);
        if (comboError) return apiServerError(comboError);
        if ((activeCombos ?? []).length !== comboIds.length || activeCombos?.some((combo) => !combo.ativa)) {
          return apiError("Um dos combos não está mais disponível. Atualize a sacola.", 409, { codigo: "COMBO_UNAVAILABLE" });
        }
        const comboById = new Map((activeCombos ?? []).map((combo) => [combo.id, Number(combo.preco)]));
        for (const raw of data.itens) {
          const item = raw as { produto?: { comboId?: unknown }; qty?: unknown; total?: unknown };
          const comboId = Number(item.produto?.comboId);
          if (!comboById.has(comboId)) continue;
          const expectedTotal = (comboById.get(comboId) ?? 0) * Math.max(1, Number(item.qty) || 1);
          if (Math.abs(Number(item.total) - expectedTotal) > 0.01) {
            return apiError("O preço de um combo foi atualizado. Confira a sacola e tente novamente.", 409, { codigo: "COMBO_UPDATED" });
          }
        }
        const { data: links, error: linksError } = await supabase
          .from("combo_itens")
          .select("combo_id, produto_id")
          .in("combo_id", comboIds);
        if (linksError) return apiServerError(linksError);
        comboLinks = links ?? [];
      }
      const idsNoCarrinho = new Set(data.itens.flatMap((raw) => {
        const item = raw as { produto?: { id?: unknown; comboId?: unknown } };
        return item.produto?.comboId != null || item.produto?.id == null
          ? []
          : [String(item.produto.id)];
      }));
      for (const link of comboLinks) idsNoCarrinho.add(String(link.produto_id));
      const agoraBrasil = getSaoPauloDateTime();
      const { data: campanhasFrete } = await supabase
        .from("promocoes_frete_gratis")
        .select("produto_id, data_inicio, data_fim, hora_inicio, hora_fim")
        .eq("ativa", true)
        .lte("data_inicio", agoraBrasil.date)
        .gte("data_fim", agoraBrasil.date);
      const freteElegivel = (campanhasFrete ?? []).some((campaign) =>
        isFreteCampaignActive(campaign, agoraBrasil) &&
        (campaign.produto_id == null || idsNoCarrinho.has(String(campaign.produto_id)))
      );
      const entrega = data.tipo_entrega === "entrega" || data.tipo_entrega === "delivery";
      const taxaEntregaCalculada = entrega
        ? freteElegivel ? 0 : Number(configLoja?.taxa_entrega ?? data.taxa_entrega)
        : 0;
      if (Math.abs(data.taxa_entrega - taxaEntregaCalculada) > 0.01) {
        return apiError(
          "O frete foi atualizado. Confira o valor na sacola e tente novamente.",
          409,
          { codigo: "SHIPPING_UPDATED" }
        );
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
          taxa_entrega: taxaEntregaCalculada,
          total: data.subtotal + taxaEntregaCalculada,
          cupom_codigo: data.cupom_codigo?.trim().toUpperCase() || null,
          itens: itensEnriquecidos,
          status: initialStatus,
          observacoes: data.observacoes,
        })
        .select("id, status, total, desconto_cupom, cupom_codigo, created_at")
        .single();

      if (error || !pedido) {
        const message = error?.message ?? "";
        if (message.includes("CUPOM_INVALIDO")) return apiError("Esse cupom não é válido.", 400);
        if (message.includes("CUPOM_FORA_DA_VALIDADE")) return apiError("Esse cupom está fora do período de validade.", 400);
        if (message.includes("CUPOM_ESGOTADO")) return apiError("Esse cupom acabou de atingir o limite de usos.", 409);
        if (message.includes("CUPOM_VALOR_MINIMO")) return apiError("O pedido não atingiu o valor mínimo deste cupom.", 400);
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
