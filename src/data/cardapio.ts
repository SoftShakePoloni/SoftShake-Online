import { supabase } from "@/integrations/supabase/client";
import { getSignedUrls } from "@/integrations/supabase/client.server";
import { notesOptionGroup, type Category, type OptionGroup, type Product, type Tag } from "./tipos";

const helperForGroup = (min: number, max: number) => {
  if (min > 0 && max === 1) return "Escolha 1 opção";
  if (min > 0) return `Escolha de ${min} a ${max} opções`;
  return `Escolha até ${max} opções`;
};

export async function fetchMenu(): Promise<Category[]> {
  const { data: categorias, error: catError } = await supabase
    .from("categorias")
    .select("id, nome, ordem")
    .order("ordem", { ascending: true });
  if (catError) { console.error("[fetchMenu] erro categorias:", catError); throw catError; }

  const { data: produtos, error: prodError } = await supabase
    .from("produtos")
    .select("id, nome, descricao, preco_base, preco_promocional, esta_disponivel, ordem, imagem_url, categoria_id, tag_id")
    .order("ordem", { ascending: true });
  if (prodError) { console.error("[fetchMenu] erro produtos:", prodError); throw prodError; }

  const { data: produtoGrupos, error: pgError } = await supabase
    .from("produto_grupos")
    .select("produto_id, grupo_id, ordem")
    .order("ordem", { ascending: true });
  if (pgError) { console.error("[fetchMenu] erro produto_grupos:", pgError); throw pgError; }

  const { data: grupos, error: grpError } = await supabase
    .from("grupos_opcoes")
    .select("id, nome, min_escolha, max_escolha, tag_id");
  if (grpError) { console.error("[fetchMenu] erro grupos_opcoes:", grpError); throw grpError; }

  const { data: opcoes, error: optError } = await supabase
    .from("opcoes")
    .select("id, grupo_id, nome, preco_adicional, status, esta_disponivel, ordem, tag_id")
    .order("ordem", { ascending: true });
  if (optError) { console.error("[fetchMenu] erro opcoes:", optError); throw optError; }

  const { data: tags } = await supabase.from("tags").select("id, nome, cor_fundo, cor_texto");
  const tagsMap = new Map<number, Tag>((tags ?? []).map((t) => [t.id, t as Tag]));

  // Gera signed URLs em lote para todos os produtos de uma vez (1 chamada só)
  const imagePaths = (produtos ?? [])
    .map((p) => p.imagem_url)
    .filter((url): url is string => !!url && !url.startsWith("http"));

  const signedUrls = imagePaths.length > 0
    ? await getSignedUrls(imagePaths)
    : new Map<string, string>();

  // Resolve a URL correta: signed se for path, ou a própria URL se já for completa
  const resolveImage = (imagem_url: string | null): string | undefined => {
    if (!imagem_url) return undefined;
    if (imagem_url.startsWith("http")) return imagem_url;
    return signedUrls.get(imagem_url) ?? undefined;
  };

  return (categorias ?? []).map((cat) => {
    const catProdutos = (produtos ?? []).filter((p) => p.categoria_id === cat.id);

    return {
      id: String(cat.id),
      name: cat.nome,
      products: catProdutos.map((prod): Product => {
        const gruposDoProduto = (produtoGrupos ?? [])
          .filter((pg) => pg.produto_id === prod.id)
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

        const optionGroups: OptionGroup[] = gruposDoProduto
          .map((pg) => {
            const grupo = (grupos ?? []).find((g) => g.id === pg.grupo_id);
            if (!grupo) return null;
            const min = grupo.min_escolha ?? 0;
            const max = grupo.max_escolha ?? 0;
            return {
              id: String(grupo.id),
              name: grupo.nome,
              helper: helperForGroup(min, max),
              required: min > 0,
              min,
              max,
              tag: grupo.tag_id ? tagsMap.get(grupo.tag_id) : undefined,
              // Mantém todas as opções no cardápio (mesmo indisponíveis).
              // Indisponível = cliente vê com tarja, sem poder selecionar.
              items: (opcoes ?? [])
                .filter((o) => o.grupo_id === grupo.id)
                .map((o) => {
                  const status = String(o.status ?? "ativo").toLowerCase();
                  const disponivel =
                    o.esta_disponivel !== false && status !== "inativo";
                  return {
                    id: String(o.id),
                    name: o.nome,
                    priceDelta: Number(o.preco_adicional ?? 0),
                    tag: o.tag_id ? tagsMap.get(o.tag_id) : undefined,
                    disponivel,
                  };
                }),
            } as OptionGroup;
          })
          .filter((g): g is OptionGroup => g !== null);

        const precoPromo =
          prod.preco_promocional != null
            ? Number(prod.preco_promocional)
            : null;

        return {
          id: String(prod.id),
          name: prod.nome,
          description: prod.descricao ?? "",
          price: Number(prod.preco_base),
          precoPromocional:
            precoPromo != null && Number.isFinite(precoPromo)
              ? precoPromo
              : null,
          image: resolveImage(prod.imagem_url),
          tag: prod.tag_id ? tagsMap.get(prod.tag_id) : undefined,
          optionGroups: [...optionGroups, notesOptionGroup],
          disponivel: prod.esta_disponivel ?? undefined,
        };
      }),
    };
  });
}

export const getFeaturedProducts = (categories: Category[]) => {
  const products = categories.flatMap((c) => c.products);
  const highlighted = products.filter((p) => p.tag);
  return (highlighted.length ? highlighted : products).slice(0, 6);
};
