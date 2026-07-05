import { NextRequest, NextResponse } from 'next/server';
import { obterSessao } from '@/lib/auth';
import { createServerClient } from '@/integrations/supabase/client.server';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const sessao = await obterSessao();
    
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      cliente_nome,
      cliente_telefone,
      tipo_entrega,
      endereco_id,
      endereco_completo,
      meio_pagamento,
      troco_para,
      subtotal,
      taxa_entrega,
      total,
      itens,
    } = body;

    // Validações básicas
    if (!cliente_nome || !cliente_telefone || !tipo_entrega || !meio_pagamento) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    if (tipo_entrega === 'entrega' && !endereco_completo) {
      return NextResponse.json(
        { erro: 'Endereço é obrigatório para entrega' },
        { status: 400 }
      );
    }

    if (!itens || itens.length === 0) {
      return NextResponse.json(
        { erro: 'Pedido sem itens' },
        { status: 400 }
      );
    }

    // Cria o pedido no banco
    const supabase = createServerClient();
    
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: sessao.id,
        cliente_nome,
        cliente_telefone,
        tipo_entrega,
        endereco_id,
        endereco_completo,
        meio_pagamento,
        troco_para,
        subtotal,
        taxa_entrega,
        total,
        itens,
        status: 'pendente',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pedido:', error);
      return NextResponse.json(
        { erro: 'Erro ao criar pedido no banco de dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mensagem: 'Pedido criado com sucesso',
      pedido,
    }, { status: 201 });

  } catch (erro) {
    console.error('Erro ao processar pedido:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
