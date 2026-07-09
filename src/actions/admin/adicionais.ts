"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/integrations/supabase/client.server";

export type OpcaoUpdate = {
  nome?: string;
  preco_adicional?: number;
  grupo_id?: number | string;
  status?: "ativo" | "inativo" | string;
  esta_disponivel?: boolean;
  ordem?: number;
  tag_id?: number | string | null;
};

function toId(id: string | number): number {
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  if (!Number.isFinite(n)) {
    throw new Error("ID de adicional inválido");
  }
  return n;
}

function sanitizeOpcaoUpdate(updates: OpcaoUpdate) {
  const payload: Record<string, unknown> = {};

  if (updates.nome !== undefined) payload.nome = updates.nome;
  if (updates.preco_adicional !== undefined) {
    payload.preco_adicional = updates.preco_adicional;
  }
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.esta_disponivel !== undefined) {
    payload.esta_disponivel = updates.esta_disponivel;
  }
  if (updates.ordem !== undefined) payload.ordem = updates.ordem;

  if (updates.grupo_id !== undefined) {
    payload.grupo_id = toId(updates.grupo_id);
  }

  if (updates.tag_id !== undefined) {
    payload.tag_id =
      updates.tag_id === null || updates.tag_id === ""
        ? null
        : toId(updates.tag_id);
  }

  return payload;
}

export async function updateOpcao(id: string | number, updates: OpcaoUpdate) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const opcaoId = toId(id);
  const payload = sanitizeOpcaoUpdate(updates);

  if (Object.keys(payload).length === 0) {
    throw new Error("Nenhum campo para atualizar");
  }

  const { data, error } = await supabase
    .from("opcoes")
    .update(payload as never)
    .eq("id", opcaoId)
    .select(
      `
      *,
      grupo:grupos_opcoes(id, nome)
    `
    )
    .maybeSingle();

  if (error) {
    console.error("Erro ao atualizar adicional:", error);
    throw new Error("Não foi possível atualizar o adicional");
  }

  if (!data) {
    throw new Error("Adicional não encontrado ou não atualizado");
  }

  return data;
}

export async function deleteOpcao(id: string | number) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const opcaoId = toId(id);

  const { error } = await supabase.from("opcoes").delete().eq("id", opcaoId);

  if (error) {
    console.error("Erro ao excluir adicional:", error);
    throw new Error("Não foi possível excluir o adicional");
  }

  return { success: true };
}
