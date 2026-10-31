import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { FormularioEndereco } from "@/components/enderecos/FormularioEndereco";
export default async function NovoEnderecoPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/auth");
  return <FormularioEndereco />;
}
