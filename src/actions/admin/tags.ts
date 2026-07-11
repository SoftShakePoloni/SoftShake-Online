"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/integrations/supabase/client.server";

export type TagRow = {
  id: number;
  nome: string;
  cor_fundo: string;
  cor_texto: string | null;
};

function toId(id: string | number): number {
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  if (!Number.isFinite(n)) throw new Error("ID de tag inválido");
  return n;
}

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

async function getNextTagId(supabase: ServiceClient): Promise<number> {
  const { data } = await supabase
    .from("tags")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (Number(data?.id) || 0) + 1;
}

export async function listTags(): Promise<TagRow[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, nome, cor_fundo, cor_texto")
    .order("nome", { ascending: true });

  if (error) {
    console.error("listTags", error);
    throw new Error("Não foi possível listar tags");
  }
  return (data || []) as TagRow[];
}

export async function createTag(input: {
  nome: string;
  cor_fundo?: string;
  cor_texto?: string | null;
}): Promise<TagRow> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const nome = input.nome.trim();
  if (!nome) throw new Error("Nome da tag é obrigatório");

  // evita duplicata por nome (case-insensitive)
  const { data: existing } = await supabase
    .from("tags")
    .select("id, nome, cor_fundo, cor_texto")
    .ilike("nome", nome)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing as TagRow;
  }

  const id = await getNextTagId(supabase);
  const { data, error } = await supabase
    .from("tags")
    .insert({
      id,
      nome,
      cor_fundo: input.cor_fundo?.trim() || "#F3EEFA",
      cor_texto: input.cor_texto?.trim() || "#4C258C",
    } as never)
    .select("id, nome, cor_fundo, cor_texto")
    .single();

  if (error || !data) {
    console.error("createTag", error);
    throw new Error(error?.message || "Não foi possível criar a tag");
  }
  return data as TagRow;
}

export async function updateTag(
  id: string | number,
  updates: {
    nome?: string;
    cor_fundo?: string;
    cor_texto?: string | null;
  }
): Promise<TagRow> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const payload: Record<string, unknown> = {};
  if (updates.nome !== undefined) payload.nome = updates.nome.trim();
  if (updates.cor_fundo !== undefined) payload.cor_fundo = updates.cor_fundo;
  if (updates.cor_texto !== undefined) payload.cor_texto = updates.cor_texto;

  if (Object.keys(payload).length === 0) {
    throw new Error("Nenhum campo para atualizar");
  }

  const { data, error } = await supabase
    .from("tags")
    .update(payload as never)
    .eq("id", toId(id))
    .select("id, nome, cor_fundo, cor_texto")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível atualizar a tag");
  }
  return data as TagRow;
}

export async function deleteTag(id: string | number) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const tagId = toId(id);

  // desvincula produtos
  await supabase
    .from("produtos")
    .update({ tag_id: null } as never)
    .eq("tag_id", tagId);

  const { error } = await supabase.from("tags").delete().eq("id", tagId);
  if (error) {
    throw new Error(error.message || "Não foi possível excluir a tag");
  }
  return { success: true };
}
