import { createClient } from "@/lib/supabase/server";
import { ProdutosManager } from "@/components/admin/produtos/ProdutosManager";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Produtos | SoftShake Admin",
  description: "Gerenciamento de produtos",
};

export default async function ProdutosPage() {
  const supabase = await createClient();

  // Verificar autenticação
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Buscar produtos com categorias
  const { data: produtos, error: produtosError } = await supabase
    .from("produtos")
    .select(
      `
      *,
      categoria:categorias(id, nome),
      tag:tags(id, nome)
    `
    )
    .order("ordem", { ascending: true });

  // Buscar categorias
  const { data: categorias, error: categoriasError } = await supabase
    .from("categorias")
    .select("*")
    .order("ordem", { ascending: true });

  if (produtosError || categoriasError) {
    console.error("Erro ao buscar dados:", produtosError || categoriasError);
  }

  return (
    <ProdutosManager
      produtosIniciais={produtos || []}
      categoriasIniciais={categorias || []}
    />
  );
}
