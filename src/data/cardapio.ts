import { supabase } from "@/integrations/supabase/client";
import { getSignedUrls } from "@/integrations/supabase/client.server";
import { notesOptionGroup, type Category, type OptionGroup, type Product, type Tag } from "./tipos";
import { getFreteDeadlineLabel, getSaoPauloDateTime, isFreteCampaignActive } from "@/lib/promocoes/frete";

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

  const { data: combos } = await supabase
    .from("combos")
    .select("id, nome, descricao, preco, imagem_url")
    .eq("ativa", true)
    .order("created_at", { ascending: false });
  const comboLinksResult = combos?.length
    ? await supabase.from("combo_itens").select("combo_id, produto_id, quantidade").in("combo_id", combos.map((combo) => combo.id))
    : null;
  const comboLinks = comboLinksResult?.data ?? [];

  const agoraBrasil = getSaoPauloDateTime();
  const { data: campanhasFrete } = await supabase
    .from("promocoes_frete_gratis")
    .select("produto_id, data_inicio, data_fim, hora_inicio, hora_fim")
    .eq("ativa", true)
    .lte("data_inicio", agoraBrasil.date)
    .gte("data_fim", agoraBrasil.date);
  const campanhasAtivas = (campanhasFrete ?? []).filter((campaign) =>
    isFreteCampaignActive(campaign, agoraBrasil)
  );

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
  imagePaths.push(...(combos ?? []).map((combo) => combo.imagem_url).filter((url): url is string => !!url && !url.startsWith("http")));

  const signedUrls = imagePaths.length > 0
    ? await getSignedUrls(imagePaths)
    : new Map<string, string>();

  // Resolve a URL correta: signed se for path, ou a própria URL se já for completa
  const resolveImage = (imagem_url: string | null): string | undefined => {
    if (!imagem_url) return undefined;
    if (imagem_url.startsWith("http")) return imagem_url;
    return signedUrls.get(imagem_url) ?? undefined;
  };

  const menuCategories = (categorias ?? []).map((cat) => {
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
          freteGratis: campanhasAtivas.some((campaign) =>
            campaign.produto_id == null || String(campaign.produto_id) === String(prod.id)
          ),
          freteGratisPrazo: (() => {
            const elegiveis = campanhasAtivas
              .filter((campaign) => campaign.produto_id == null || String(campaign.produto_id) === String(prod.id))
              .sort((a, b) => `${a.data_fim}T${a.hora_fim}`.localeCompare(`${b.data_fim}T${b.hora_fim}`));
            const proxima = elegiveis[0];
            return proxima
              ? getFreteDeadlineLabel(proxima.data_fim, proxima.hora_fim ?? "23:59", agoraBrasil.date)
              : undefined;
          })(),
          image: resolveImage(prod.imagem_url),
          tag: prod.tag_id ? tagsMap.get(prod.tag_id) : undefined,
          optionGroups: [...optionGroups, notesOptionGroup],
          disponivel: prod.esta_disponivel ?? undefined,
        };
      }),
    };
  });

  const productById = new Map((produtos ?? []).map((product) => [product.id, product]));
  const comboProducts: Product[] = (combos ?? []).flatMap((combo) => {
    const links = (comboLinks ?? []).filter((link) => link.combo_id === combo.id);
    const selected = links.flatMap((link) => {
      const product = productById.get(link.produto_id);
      return product ? [{ product, quantity: link.quantidade }] : [];
    });
    if (selected.length < 2) return [];
    const referencePrice = selected.reduce((sum, item) => sum + Number(item.product.preco_base) * item.quantity, 0);
    const comboItems = selected.map(({ product, quantity }) => ({ productId: product.id, name: product.nome, quantity }));
    const details = comboItems.map((item) => `${item.quantity}× ${item.name}`).join(" · ");
    const activeFreight = campanhasAtivas.filter((campaign) =>
      campaign.produto_id == null || selected.some(({ product }) => String(campaign.produto_id) === String(product.id))
    ).sort((a, b) => `${a.data_fim}T${a.hora_fim}`.localeCompare(`${b.data_fim}T${b.hora_fim}`));
    const firstImage = selected.find(({ product }) => product.imagem_url)?.product.imagem_url ?? null;
    return [{
      id: `combo-${combo.id}`,
      comboId: combo.id,
      comboItems,
      name: combo.nome,
      description: [combo.descricao, `Inclui: ${details}`].filter(Boolean).join(" "),
      price: referencePrice,
      precoPromocional: Number(combo.preco) < referencePrice ? Number(combo.preco) : null,
      image: resolveImage(combo.imagem_url ?? firstImage),
      freteGratis: activeFreight.length > 0,
      freteGratisPrazo: activeFreight[0]
        ? getFreteDeadlineLabel(activeFreight[0].data_fim, activeFreight[0].hora_fim ?? "23:59", agoraBrasil.date)
        : undefined,
      tag: undefined,
      optionGroups: [notesOptionGroup],
      disponivel: true,
    } satisfies Product];
  });

  return comboProducts.length
    ? [...menuCategories, { id: "combos", name: "Combos", products: comboProducts }]
    : menuCategories;
}

export const getFeaturedProducts = (categories: Category[]) => {
  const products = categories.flatMap((c) => c.products);
  const highlighted = products.filter((p) => p.tag);
  return (highlighted.length ? highlighted : products).slice(0, 6);
};
