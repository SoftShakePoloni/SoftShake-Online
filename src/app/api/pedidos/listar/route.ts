import { NextResponse } from 'next/server';
import { obterSessao } from '@/lib/auth';
import { createServerClient } from '@/integrations/supabase/client.server';
import {
  enrichPedidoItens,
  type OpcaoLookup,
  type GrupoLookup,
} from '@/lib/utils/pedido';

export async function GET() {
  try {
    const sessao = await obterSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    const [{ data: pedidos, error }, { data: opcoes }, { data: grupos }] =
      await Promise.all([
        supabase
          .from('pedidos')
          .select('*')
          .eq('cliente_id', sessao.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('opcoes')
          .select(
            'id, nome, preco_adicional, grupo_id, grupo:grupos_opcoes(id, nome)'
          ),
        supabase.from('grupos_opcoes').select('id, nome'),
      ]);

    if (error) {
      return NextResponse.json(
        { erro: 'Erro ao buscar pedidos' },
        { status: 500 }
      );
    }

    const pedidosEnriquecidos = (pedidos || []).map((pedido) => ({
      ...pedido,
      itens: enrichPedidoItens(
        Array.isArray(pedido.itens) ? pedido.itens : [],
        (opcoes || []) as OpcaoLookup[],
        (grupos || []) as GrupoLookup[]
      ),
    }));

    return NextResponse.json(
      {
        pedidos: pedidosEnriquecidos,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
