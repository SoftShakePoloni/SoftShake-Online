'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, MapPin, Home, CreditCard, Banknote, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { formatBRL } from '@/data/tipos';
import Link from 'next/link';

type ItemPedido = {
  uid: string;
  qty: number;
  produto: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  total: number;
};

type Pedido = {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  tipo_entrega: 'entrega' | 'retirada';
  endereco_completo: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  } | null;
  meio_pagamento: 'dinheiro' | 'pix' | 'cartao';
  troco_para: string | null;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  itens: ItemPedido[];
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500 text-white' },
  confirmado: { label: 'Confirmado', color: 'bg-blue-500 text-white' },
  preparando: { label: 'Em preparo', color: 'bg-purple-500 text-white' },
  saiu_entrega: { label: 'A caminho', color: 'bg-indigo-500 text-white' },
  entregue: { label: 'Entregue', color: 'bg-green-500 text-white' },
  cancelado: { label: 'Cancelado', color: 'bg-red-500 text-white' },
};

export default function PaginaPedidos() {
  const { cliente, loading } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !cliente) {
      // Limpa pedidos e redireciona
      setPedidos([]);
      router.push('/entrar');
    }
  }, [loading, cliente, router]);

  useEffect(() => {
    const carregarPedidos = async () => {
      if (!cliente) {
        setPedidos([]);
        setLoadingPedidos(false);
        return;
      }

      try {
        const resposta = await fetch('/api/pedidos/listar');
        
        if (resposta.ok) {
          const dados = await resposta.json();
          setPedidos(dados.pedidos || []);
        } else {
          setPedidos([]);
        }
      } catch {
        setPedidos([]);
      } finally {
        setLoadingPedidos(false);
      }
    };

    if (cliente) {
      carregarPedidos();
      
      // Atualizar pedidos a cada 10 segundos
      const interval = setInterval(carregarPedidos, 10000);
      return () => clearInterval(interval);
    } else {
      setPedidos([]);
      setLoadingPedidos(false);
    }
  }, [cliente]);

  if (loading || loadingPedidos) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  if (pedidos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-2xl mx-auto px-4 py-16 pb-24 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold mb-3">Nenhum pedido ainda</h1>
          <p className="text-muted-foreground mb-8">
            Quando você fizer um pedido, ele aparecerá aqui
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            Ver Cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground text-sm">Acompanhe seus pedidos em tempo real</p>
        </div>

        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const statusInfo = STATUS_LABELS[pedido.status] || STATUS_LABELS.pendente;
            const dataFormatada = new Date(pedido.created_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            const isExpanded = pedidoExpandido === pedido.id;

            return (
              <div
                key={pedido.id}
                className="bg-card rounded-2xl border-2 overflow-hidden"
              >
                <button
                  onClick={() => setPedidoExpandido(isExpanded ? null : pedido.id)}
                  className="w-full text-left p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">
                          Pedido #{pedido.id.slice(0, 8)}
                        </h3>
                        <Badge className={`${statusInfo.color} text-xs px-2 py-1`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {dataFormatada}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {formatBRL(pedido.total)}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground ml-auto" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground ml-auto" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {pedido.tipo_entrega === 'entrega' ? (
                        <MapPin className="h-4 w-4" />
                      ) : (
                        <Home className="h-4 w-4" />
                      )}
                      {pedido.tipo_entrega === 'entrega' ? 'Entrega' : 'Retirada'}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      {pedido.meio_pagamento === 'dinheiro' ? (
                        <Banknote className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      <span className="capitalize">{pedido.meio_pagamento}</span>
                    </div>
                    <span>•</span>
                    <span>{pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-6 py-4 bg-muted/30 space-y-4">
                    {/* Endereço */}
                    {pedido.tipo_entrega === 'entrega' && pedido.endereco_completo && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          Endereço de entrega
                        </h4>
                        <p className="text-sm text-muted-foreground pl-6">
                          {pedido.endereco_completo.logradouro}, {pedido.endereco_completo.numero}
                          {pedido.endereco_completo.complemento && ` - ${pedido.endereco_completo.complemento}`}
                          <br />
                          {pedido.endereco_completo.bairro} - {pedido.endereco_completo.cidade}/{pedido.endereco_completo.estado}
                          <br />
                          CEP: {pedido.endereco_completo.cep}
                        </p>
                      </div>
                    )}

                    {/* Itens */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Itens do pedido</h4>
                      <div className="space-y-2">
                        {pedido.itens.map((item: ItemPedido, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-card rounded-lg p-3">
                            <span className="font-medium">
                              {item.qty}x {item.produto.name}
                            </span>
                            <span className="font-bold">
                              {formatBRL(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumo */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{formatBRL(pedido.subtotal)}</span>
                      </div>
                      {pedido.taxa_entrega > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa de entrega</span>
                          <span className="font-medium">{formatBRL(pedido.taxa_entrega)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">{formatBRL(pedido.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
