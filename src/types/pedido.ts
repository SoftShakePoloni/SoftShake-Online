export interface EnderecoObject {
  id?: string;
  cep?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  apelido?: string;
  principal?: boolean;
  created_at?: string;
  logradouro?: string;
  complemento?: string;
}

export interface PedidoComplemento {
  id?: string;
  name: string;
  price: number;
  groupId?: string;
  groupName?: string;
}

export interface PedidoItem {
  id?: string;
  uid?: string;
  qty: number;
  total: number;
  observacoes?: string;
  produto: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  /** Mapa original grupoId → optionIds (como vem do carrinho) */
  selections?: Record<string, string[]> | PedidoComplemento[];
  /** Lista resolvida com nomes (preferencial para UI/impressão) */
  adicionais?: PedidoComplemento[];
  selectionsResolved?: PedidoComplemento[];
  complementos?: PedidoComplemento[] | Record<string, unknown> | string | null;
}

export interface Pedido {
  id: string;
  cliente_nome: string;
  cliente_telefone?: string;
  tipo_entrega: "delivery" | "entrega" | "retirada";
  endereco_completo?: string;
  meio_pagamento: string;
  /** Pode vir string do Postgres/JSONB; sempre normalize com Number() na UI */
  troco_para?: number | string | null;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  itens: PedidoItem[];
  status: "pendente" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export type PedidoStatus = Pedido["status"];

export const statusConfig = {
  pendente: {
    label: "Recebido",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  preparando: {
    label: "Preparando",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  saiu_entrega: {
    label: "Saiu para Entrega",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  entregue: {
    label: "Entregue",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};
