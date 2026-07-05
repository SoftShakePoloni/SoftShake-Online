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
  price: number;
  image?: string;
  tag?: Tag;
  optionGroups?: OptionGroup[];
};

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
