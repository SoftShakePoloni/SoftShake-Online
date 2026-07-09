export interface GrupoOpcoes {
  id: string | number;
  nome: string;
  min_escolha: number;
  max_escolha: number;
  tag_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Opcao {
  id: string | number;
  grupo_id: string | number;
  nome: string;
  preco_adicional: number;
  status: "ativo" | "inativo";
  esta_disponivel: boolean;
  ordem: number;
  tag_id?: number;
  created_at?: string;
  updated_at?: string;
  grupo?: GrupoOpcoes;
}
