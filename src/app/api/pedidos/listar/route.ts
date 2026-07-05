import { NextRequest, NextResponse } from 'next/server';
import { obterSessao } from '@/lib/auth';
import { createServerClient } from '@/integrations/supabase/client.server';

export async function GET() {
  try {
    // Verifica autenticação
    const sessao = await obterSessao();
    
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Busca pedidos do cliente
    const supabase = createServerClient();
    
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_id', sessao.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { erro: 'Erro ao buscar pedidos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pedidos: pedidos || [],
    }, { status: 200 });

  } catch {
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
