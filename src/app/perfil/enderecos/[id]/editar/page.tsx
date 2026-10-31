import { notFound, redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { createServerClient } from "@/integrations/supabase/client.server";
import type { Endereco } from "@/types/endereco";
import { FormularioEndereco } from "@/components/enderecos/FormularioEndereco";
export default async function EditarEndereco({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await obterSessao();
  if (!session) redirect("/entrar");
  const { id } = await params;
  const { data, error } = await createServerClient()
    .from("clientes")
    .select("enderecos_adicionais")
    .eq("id", session.id)
    .single();
  if (error) throw Error("Não foi possível carregar seu endereço.");
  const address = (
    Array.isArray(data?.enderecos_adicionais)
      ? (data.enderecos_adicionais as unknown as Endereco[])
      : []
  ).find((item) => item.id === id);
  if (!address) notFound();
  return <FormularioEndereco endereco={address} />;
}
