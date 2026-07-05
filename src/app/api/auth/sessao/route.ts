import { NextResponse } from 'next/server';
import { obterSessao } from '@/lib/auth';
import { createServerClient } from '@/integrations/supabase/client.server';

/**
 * Rota para verificar a sessão atual do usuário
 * Use esta rota como exemplo para proteger outras rotas
 */
export async function GET() {
  try {
    const sessao = await obterSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Busca dados completos do cliente incluindo endereços
    const supabase = createServerClient();
    const { data: clienteCompleto } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', sessao.id)
      .single();

    return NextResponse.json({
      autenticado: true,
      cliente: clienteCompleto || sessao,
    });
  } catch (erro) {
    console.error('Erro ao verificar sessão:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
