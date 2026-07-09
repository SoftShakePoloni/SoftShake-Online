"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/integrations/supabase/client.server";

export type ProdutoUpdate = {
  nome?: string;
  descricao?: string | null;
  preco_base?: number;
  categoria_id?: number | string | null;
  esta_disponivel?: boolean;
  ordem?: number;
  imagem_url?: string | null;
  tag_id?: number | string | null;
};

function toId(id: string | number): number {
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  if (!Number.isFinite(n)) {
    throw new Error("ID de produto inválido");
  }
  return n;
}

function sanitizeProdutoUpdate(updates: ProdutoUpdate) {
  const payload: Record<string, unknown> = {};

  if (updates.nome !== undefined) payload.nome = updates.nome;
  if (updates.descricao !== undefined) payload.descricao = updates.descricao;
  if (updates.preco_base !== undefined) payload.preco_base = updates.preco_base;
  if (updates.esta_disponivel !== undefined) {
    payload.esta_disponivel = updates.esta_disponivel;
  }
  if (updates.ordem !== undefined) payload.ordem = updates.ordem;
  if (updates.imagem_url !== undefined) payload.imagem_url = updates.imagem_url;

  if (updates.categoria_id !== undefined) {
    payload.categoria_id =
      updates.categoria_id === null || updates.categoria_id === ""
        ? null
        : toId(updates.categoria_id);
  }

  if (updates.tag_id !== undefined) {
    payload.tag_id =
      updates.tag_id === null || updates.tag_id === ""
        ? null
        : toId(updates.tag_id);
  }

  return payload;
}

export async function updateProduto(
  id: string | number,
  updates: ProdutoUpdate
) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const produtoId = toId(id);
  const payload = sanitizeProdutoUpdate(updates);

  if (Object.keys(payload).length === 0) {
    throw new Error("Nenhum campo para atualizar");
  }

  const { data, error } = await supabase
    .from("produtos")
    .update(payload as never)
    .eq("id", produtoId)
    .select(
      `
      *,
      categoria:categorias(id, nome),
      tag:tags(id, nome)
    `
    )
    .maybeSingle();

  if (error) {
    console.error("Erro ao atualizar produto:", error);
    throw new Error("Não foi possível atualizar o produto");
  }

  if (!data) {
    throw new Error("Produto não encontrado ou não atualizado");
  }

  return data;
}

export async function deleteProduto(id: string | number) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const produtoId = toId(id);

  const { error } = await supabase.from("produtos").delete().eq("id", produtoId);

  if (error) {
    console.error("Erro ao excluir produto:", error);
    throw new Error("Não foi possível excluir o produto");
  }

  return { success: true };
}
