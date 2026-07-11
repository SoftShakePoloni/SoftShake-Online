import { requireAdmin } from "@/lib/admin/auth";
import { listProdutosAdmin } from "@/actions/admin/produtos";
import { listCategorias } from "@/actions/admin/categorias";
import { CatalogoManager } from "@/components/admin/catalogo";
import type { CatalogProduto, CatalogCategoria } from "@/components/admin/catalogo/types";

export const metadata = {
  title: "Catálogo | SoftShake Admin",
  description: "Gerenciamento de produtos, categorias e complementos",
};

export default async function ProdutosPage() {
  await requireAdmin();

  let produtos: CatalogProduto[] = [];
  let categorias: CatalogCategoria[] = [];

  try {
    const [p, c] = await Promise.all([
      listProdutosAdmin(500),
      listCategorias(),
    ]);
    produtos = (p || []) as CatalogProduto[];
    categorias = (c || []) as CatalogCategoria[];
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
  }

  return (
    <CatalogoManager
      produtosIniciais={produtos}
      categoriasIniciais={categorias}
    />
  );
}
