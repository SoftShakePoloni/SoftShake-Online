import "server-only";
import { createServerClient } from "@/integrations/supabase/client.server";
import { notesOptionGroup, type Category, type Product, type Tag, type OptionGroup } from "./tipos";
import { getFreteDeadlineLabel, getSaoPauloDateTime, isFreteCampaignActive } from "@/lib/promocoes/frete";
import { imageProxyUrl } from "@/lib/image/proxy-url";
import { loadComboOptionGroups, resolveComboChoices, type ComboOptionsConfig } from "@/lib/combos/options";

export async function fetchMenu(): Promise<Category[]> {
  const supabase = createServerClient();
  const agoraBrasil = getSaoPauloDateTime();
  const [categoriesResult,productsResult,combosResult,freightResult,tagsResult] = await Promise.all([
    supabase.from("categorias").select("id, nome, ordem").order("ordem", {ascending:true}),
    supabase.from("produtos").select("id, nome, descricao, preco_base, preco_promocional, esta_disponivel, ordem, imagem_url, categoria_id, tag_id").order("ordem", {ascending:true}),
    supabase.from("combos").select("*").eq("ativa",true).order("created_at",{ascending:false}),
    supabase.from("promocoes_frete_gratis").select("produto_id, data_inicio, data_fim, hora_inicio, hora_fim").eq("ativa",true).lte("data_inicio",agoraBrasil.date).gte("data_fim",agoraBrasil.date),
    supabase.from("tags").select("id, nome, cor_fundo, cor_texto"),
  ]);
  const {data:categorias,error:catError}=categoriesResult;
  const {data:produtos,error:prodError}=productsResult;
  if(catError)throw catError;
  if(prodError)throw prodError;
  const combos=combosResult.data;
  const comboLinksResult=combos?.length ? await supabase.from("combo_itens").select("combo_id, produto_id, quantidade").in("combo_id",combos.map(combo=>combo.id)) : null;
  const comboLinks=comboLinksResult?.data??[];
  const campanhasAtivas=(freightResult.data??[]).filter(campaign=>isFreteCampaignActive(campaign,agoraBrasil));
  const tags=tagsResult.data;
  const tagsMap = new Map<number, Tag>((tags ?? []).map((t) => [t.id, t as Tag]));

  const menuCategories = (categorias ?? []).map((cat) => {
    const catProdutos = (produtos ?? []).filter((p) => p.categoria_id === cat.id);

    return {
      id: String(cat.id),
      name: cat.nome,
      products: catProdutos.map((prod): Product => {
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
          image: imageProxyUrl(prod.imagem_url) ?? undefined,
          tag: prod.tag_id ? tagsMap.get(prod.tag_id) : undefined,
          // Opções e adicionais são carregados só quando o cliente abre este produto.
          optionGroups: [notesOptionGroup],
          disponivel: prod.esta_disponivel ?? undefined,
        };
      }),
    };
  });

  const productById = new Map((produtos ?? []).map((product) => [product.id, product]));
  const comboOptions = new Map(await Promise.all((combos ?? []).map(async combo => {
    const config = combo.opcoes_config as ComboOptionsConfig | null;
    try {
      const groups = config ? await loadComboOptionGroups(supabase, comboLinks.filter(link => link.combo_id === combo.id)) : [];
      const fixed = config?.modo === 'fixo' ? resolveComboChoices(groups, config.selecoes) : null;
      return [combo.id, {config, groups, fixed, available: true as boolean}] as const;
    } catch {
      return [combo.id, {config, groups: [] as OptionGroup[], fixed: null, available: false as boolean}] as const;
    }
  })));
  const comboProducts: Product[] = (combos ?? []).flatMap((combo) => {
    const options = comboOptions.get(combo.id)!;
    const links = (comboLinks ?? []).filter((link) => link.combo_id === combo.id);
    const selected = links.flatMap((link) => {
      const product = productById.get(link.produto_id);
      return product ? [{ product, quantity: link.quantidade }] : [];
    });
    if (selected.length < 2) return [];
    const referencePrice = selected.reduce((sum, item) => sum + Number(item.product.preco_base) * item.quantity, 0) + (options.fixed?.extras ?? 0);
    const comboItems = selected.map(({ product, quantity }) => ({ productId: product.id, name: product.nome, quantity }));
    const details = comboItems.map((item) => `${item.quantity}× ${item.name}`).join(" · ");
    const activeFreight = campanhasAtivas.filter((campaign) =>
      campaign.produto_id == null || selected.some(({ product }) => String(campaign.produto_id) === String(product.id))
    ).sort((a, b) => `${a.data_fim}T${a.hora_fim}`.localeCompare(`${b.data_fim}T${b.hora_fim}`));
    const firstImage = selected.find(({ product }) => product.imagem_url)?.product.imagem_url ?? null;
    return [{
      id: `combo-${combo.id}`,
      comboId: combo.id,
      comboOptionsMode: options.config?.modo,
      comboFixedChoices: options.fixed?.resolved.map(choice => ({...choice, price: 0})),
      comboItems,
      name: combo.nome,
      description: [combo.descricao, `Inclui: ${details}`].filter(Boolean).join(" "),
      price: Math.max(referencePrice, Number(combo.preco)),
      precoPromocional: Number(combo.preco) < referencePrice ? Number(combo.preco) : null,
      image: imageProxyUrl(combo.imagem_url ?? firstImage) ?? undefined,
      freteGratis: activeFreight.length > 0,
      freteGratisPrazo: activeFreight[0]
        ? getFreteDeadlineLabel(activeFreight[0].data_fim, activeFreight[0].hora_fim ?? "23:59", agoraBrasil.date)
        : undefined,
      tag: undefined,
      optionGroups: [...(options.config?.modo === 'cliente' ? options.groups : []), notesOptionGroup],
      disponivel: options.available && selected.every(({product}) => product.esta_disponivel !== false),
    } satisfies Product];
  });

  return comboProducts.length
    ? [...menuCategories, { id: "combos", name: "Combos", products: comboProducts }]
    : menuCategories;
}
