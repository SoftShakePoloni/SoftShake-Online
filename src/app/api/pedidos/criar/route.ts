import { NextRequest, NextResponse } from 'next/server';
import { obterSessao } from '@/lib/auth';
import { createServerClient } from '@/integrations/supabase/client.server';
import {
  enrichPedidoItens,
  type OpcaoLookup,
  type GrupoLookup,
} from '@/lib/utils/pedido';

export async function POST(request: NextRequest) {
  try {
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

    const supabase = createServerClient();

    // Preferências da loja (status aberto + auto-aceite) em uma query.
    // Fallback se colunas novas ainda não existirem no banco.
    type ConfigRow = {
      esta_aberto?: boolean | null;
      aceitar_pedidos_automaticamente?: boolean | null;
      aceitando_pedidos?: boolean | null;
    };

    let configLoja: ConfigRow | null = null;
    {
      const full = await supabase
        .from('configuracoes_loja')
        .select('esta_aberto, aceitar_pedidos_automaticamente, aceitando_pedidos')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!full.error && full.data) {
        configLoja = full.data as ConfigRow;
      } else {
        const basic = await supabase
          .from('configuracoes_loja')
          .select('esta_aberto, aceitar_pedidos_automaticamente')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!basic.error && basic.data) {
          configLoja = basic.data as ConfigRow;
        } else if (full.error || basic.error) {
          console.warn(
            'configuracoes_loja indisponível na criação do pedido:',
            full.error?.message || basic.error?.message
          );
        }
      }
    }

    if (configLoja) {
      const lojaAberta = configLoja.esta_aberto !== false;
      const aceitando =
        configLoja.aceitando_pedidos !== undefined &&
        configLoja.aceitando_pedidos !== null
          ? Boolean(configLoja.aceitando_pedidos)
          : lojaAberta;

      if (!lojaAberta || !aceitando) {
        return NextResponse.json(
          {
            erro:
              'A loja está fechada no momento e não está aceitando pedidos.',
          },
          { status: 403 }
        );
      }
    }

    // Garante que opções (IDs) sejam gravadas com nomes legíveis
    const [{ data: opcoes }, { data: grupos }] = await Promise.all([
      supabase
        .from('opcoes')
        .select('id, nome, preco_adicional, grupo_id, grupo:grupos_opcoes(id, nome)'),
      supabase.from('grupos_opcoes').select('id, nome'),
    ]);

    const itensEnriquecidos = enrichPedidoItens(
      itens,
      (opcoes || []) as OpcaoLookup[],
      (grupos || []) as GrupoLookup[]
    ).map((item) => ({
      ...item,
      // Garante adicionais nomeados persistidos no JSON
      adicionais: item.adicionais || item.selectionsResolved || [],
    }));

    // Aceite automático: lê direto da config (sem server action / dynamic import)
    const autoAceite = Boolean(configLoja?.aceitar_pedidos_automaticamente);
    const initialStatus: 'pendente' | 'preparando' = autoAceite
      ? 'preparando'
      : 'pendente';

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
        itens: itensEnriquecidos,
        status: initialStatus,
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
      auto_aceito: autoAceite,
    }, { status: 201 });

  } catch (erro) {
    console.error('Erro ao processar pedido:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
