export type Tag = {
  id: number;
  nome: string;
  cor_fundo: string;
  cor_texto: string;
};

export type OptionItem = {
  id: string;
  name: string;
  priceDelta?: number;
  tag?: Tag;
  disponivel?: boolean;
};

export type OptionGroup = {
  id: string;
  name: string;
  helper?: string;
  required?: boolean;
  min?: number;
  max: number;
  items: OptionItem[];
  tag?: Tag;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  /** Preço base (de tabela) */
  price: number;
  /** Preço promocional opcional; se válido e < price, é o cobrado */
  precoPromocional?: number | null;
  image?: string;
  tag?: Tag;
  optionGroups?: OptionGroup[];
  disponivel?: boolean;
};

/** Preço unitário efetivo (promo se ativa, senão base) */
export function getProductUnitPrice(product: Product): number {
  const base = Number(product.price) || 0;
  const promo = product.precoPromocional;
  if (
    promo != null &&
    Number.isFinite(Number(promo)) &&
    Number(promo) > 0 &&
    Number(promo) < base
  ) {
    return Number(promo);
  }
  return base;
}

export function hasProductPromo(product: Product): boolean {
  return getProductUnitPrice(product) < (Number(product.price) || 0);
}

/** % de desconto arredondado (0 se sem promo) */
export function productDiscountPercent(product: Product): number {
  const base = Number(product.price) || 0;
  if (base <= 0 || !hasProductPromo(product)) return 0;
  const unit = getProductUnitPrice(product);
  return Math.max(1, Math.round(((base - unit) / base) * 100));
}

export type Category = {
  id: string;
  name: string;
  subtitle?: string;
  products: Product[];
};

export const notesOptionGroup: OptionGroup = {
  id: "obs",
  name: "Observações",
  helper: "Opcional",
  max: 0,
  items: [],
};

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
