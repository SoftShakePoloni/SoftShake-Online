import type { Product } from "@/data/tipos";

export type ComplementoResolvido = {
  id?: string;
  name: string;
  price: number;
  groupId?: string;
  groupName?: string;
};

export type OpcaoLookup = {
  id: string | number;
  nome: string;
  preco_adicional?: number | null;
  grupo_id?: string | number | null;
  grupo?: { id?: string | number; nome?: string } | null;
};

export type GrupoLookup = {
  id: string | number;
  nome: string;
};

/** Resolve selections do carrinho (grupoId → optionIds) usando os grupos do produto. */
export function resolveSelectionsFromProduct(
  produto: Product,
  selections: Record<string, string[]> | undefined | null
): ComplementoResolvido[] {
  if (!selections || !produto?.optionGroups) return [];

  const result: ComplementoResolvido[] = [];

  for (const grupo of produto.optionGroups) {
    if (grupo.id === "obs") continue;
    const ids = selections[grupo.id] ?? selections[String(grupo.id)] ?? [];
    for (const id of ids) {
      const item = grupo.items.find(
        (i) => String(i.id) === String(id)
      );
      if (item) {
        result.push({
          id: String(item.id),
          name: item.name,
          price: Number(item.priceDelta ?? 0),
          groupId: String(grupo.id),
          groupName: grupo.name,
        });
      }
    }
  }

  return result;
}

/** Resolve selections (IDs) usando mapas de opções/grupos do banco. */
export function resolveSelectionsFromLookup(
  selections: Record<string, string[] | number[]> | undefined | null,
  opcoesById: Map<string, OpcaoLookup>,
  gruposById?: Map<string, GrupoLookup>
): ComplementoResolvido[] {
  if (!selections || typeof selections !== "object") return [];

  const result: ComplementoResolvido[] = [];

  for (const [groupId, optionIds] of Object.entries(selections)) {
    if (groupId === "obs") continue;
    if (!Array.isArray(optionIds)) continue;

    const grupoNome =
      gruposById?.get(String(groupId))?.nome ??
      opcoesById.get(String(optionIds[0]))?.grupo?.nome;

    for (const rawId of optionIds) {
      const id = String(rawId);
      const opcao = opcoesById.get(id);
      if (opcao) {
        result.push({
          id,
          name: opcao.nome,
          price: Number(opcao.preco_adicional ?? 0),
          groupId: String(groupId),
          groupName:
            opcao.grupo?.nome ||
            grupoNome ||
            gruposById?.get(String(opcao.grupo_id ?? groupId))?.nome,
        });
      } else {
        // Fallback: ainda mostra o ID se não achar (melhor que sumir)
        result.push({
          id,
          name: `Opção #${id}`,
          price: 0,
          groupId: String(groupId),
          groupName: grupoNome,
        });
      }
    }
  }

  return result;
}

function isNamedComplemento(value: unknown): value is ComplementoResolvido {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === "string" && v.name.length > 0;
}

function normalizeNamed(value: any): ComplementoResolvido {
  return {
    id: value.id != null ? String(value.id) : undefined,
    name: String(value.name ?? value.nome ?? ""),
    price: Number(value.price ?? value.preco ?? value.preco_adicional ?? 0),
    groupId:
      value.groupId != null
        ? String(value.groupId)
        : value.group_id != null
          ? String(value.group_id)
          : undefined,
    groupName:
      value.groupName ??
      value.group_name ??
      value.grupo?.nome ??
      value.grupoNome,
  };
}

/**
 * Extrai complementos/adicionais de um item de pedido.
 * Suporta:
 * - adicionais: [{ name, price, groupName }]
 * - selections: [{ name, price }] (array resolvido)
 * - selections: { grupoId: [opcaoId, ...] } (precisa de lookup)
 * - complementos: JSON legado
 */
export function extractComplementos(
  item: any,
  lookup?: {
    opcoesById?: Map<string, OpcaoLookup>;
    gruposById?: Map<string, GrupoLookup>;
  }
): ComplementoResolvido[] {
  const complementos: ComplementoResolvido[] = [];

  // 1) Campo adicionais (preferencial — gravado com nomes)
  if (item?.adicionais) {
    const list = Array.isArray(item.adicionais)
      ? item.adicionais
      : typeof item.adicionais === "string"
        ? safeParseArray(item.adicionais)
        : [];
    for (const entry of list) {
      if (isNamedComplemento(entry) || entry?.nome) {
        const n = normalizeNamed(entry);
        if (n.name) complementos.push(n);
      }
    }
    if (complementos.length > 0) return complementos;
  }

  // 2) selections como array de objetos nomeados
  if (Array.isArray(item?.selections)) {
    for (const entry of item.selections) {
      if (isNamedComplemento(entry) || entry?.nome) {
        const n = normalizeNamed(entry);
        if (n.name) complementos.push(n);
      }
    }
    if (complementos.length > 0) return complementos;
  }

  // 3) selections como mapa grupoId → optionIds
  if (
    item?.selections &&
    typeof item.selections === "object" &&
    !Array.isArray(item.selections)
  ) {
    const keys = Object.keys(item.selections);
    const values = Object.values(item.selections);
    const looksLikeIdMap =
      keys.length > 0 &&
      values.every(
        (v) =>
          Array.isArray(v) &&
          v.every((x) => typeof x === "string" || typeof x === "number")
      );

    if (looksLikeIdMap) {
      if (lookup?.opcoesById) {
        return resolveSelectionsFromLookup(
          item.selections,
          lookup.opcoesById,
          lookup.gruposById
        );
      }
      // Sem lookup: tenta achar nomes embutidos no produto do item
      if (item.produto?.optionGroups) {
        return resolveSelectionsFromProduct(item.produto, item.selections);
      }
    }
  }

  // 4) complementos JSONB legado
  if (item?.complementos) {
    const parsed =
      typeof item.complementos === "string"
        ? safeParse(item.complementos)
        : item.complementos;

    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (isNamedComplemento(entry) || entry?.nome) {
          const n = normalizeNamed(entry);
          if (n.name) complementos.push(n);
        }
      }
    } else if (parsed && typeof parsed === "object") {
      Object.values(parsed).forEach((grupo: any) => {
        if (Array.isArray(grupo)) {
          for (const entry of grupo) {
            if (isNamedComplemento(entry) || entry?.nome) {
              const n = normalizeNamed(entry);
              if (n.name) complementos.push(n);
            }
          }
        } else if (isNamedComplemento(grupo) || grupo?.nome) {
          const n = normalizeNamed(grupo);
          if (n.name) complementos.push(n);
        }
      });
    }
  }

  return complementos;
}

/** Agrupa complementos por grupo para exibição. */
export function groupComplementos(complementos: ComplementoResolvido[]) {
  const groups = new Map<
    string,
    { groupName: string; items: ComplementoResolvido[] }
  >();

  for (const c of complementos) {
    const key = c.groupId || c.groupName || "_outros";
    const name = c.groupName || "Adicionais";
    if (!groups.has(key)) {
      groups.set(key, { groupName: name, items: [] });
    }
    groups.get(key)!.items.push(c);
  }

  return Array.from(groups.values());
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function safeParseArray(value: string): any[] {
  const parsed = safeParse(value);
  return Array.isArray(parsed) ? parsed : [];
}

/** Enriquece itens de pedido resolvendo IDs de opções para nomes. */
export function enrichPedidoItens(
  itens: any[],
  opcoes: OpcaoLookup[],
  grupos?: GrupoLookup[]
): any[] {
  const opcoesById = new Map(
    opcoes.map((o) => [String(o.id), o] as const)
  );
  const gruposById = new Map(
    (grupos ?? []).map((g) => [String(g.id), g] as const)
  );

  // Preenche grupo nos maps a partir da relação embutida
  for (const o of opcoes) {
    if (o.grupo?.id != null && o.grupo.nome && !gruposById.has(String(o.grupo.id))) {
      gruposById.set(String(o.grupo.id), {
        id: o.grupo.id,
        nome: o.grupo.nome,
      });
    }
  }

  return (itens ?? []).map((item) => {
    const adicionais = extractComplementos(item, { opcoesById, gruposById });
    return {
      ...item,
      adicionais,
      // Mantém selections originais, mas garante array nomeado para consumidores antigos
      selectionsResolved: adicionais,
    };
  });
}
