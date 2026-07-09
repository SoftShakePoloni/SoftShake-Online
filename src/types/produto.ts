export interface Produto {
  id: string | number;
  categoria_id: string | number;
  nome: string;
  descricao?: string;
  preco_base: number;
  esta_disponivel: boolean;
  ordem: number;
  imagem_url?: string;
  tag_id?: string | number | null;
  created_at?: string;
  updated_at?: string;
  // Relações
  categoria?: {
    id: string | number;
    nome: string;
  };
  tag?: {
    id: string | number;
    nome: string;
  };
}

export interface Categoria {
  id: string | number;
  nome: string;
  ordem: number;
}

export interface Tag {
  id: string | number;
  nome: string;
}

export type ProdutoFormData = Omit<Produto, "id" | "created_at" | "updated_at">;
