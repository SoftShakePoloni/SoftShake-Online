import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/integrations/supabase/client.server';
import { obterSessao, normalizarTelefone } from '@/lib/auth';

const atualizarSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
});

export async function PUT(request: NextRequest) {
  try {
    // Verificar se está autenticado
    const sessao = await obterSessao();
    
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar dados com Zod
    const validacao = atualizarSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: validacao.error.format() },
        { status: 400 }
      );
    }

    const { nome, telefone } = validacao.data;
    const telefoneNormalizado = normalizarTelefone(telefone);

    const supabase = createServerClient();

    // Verificar se outro cliente já está usando esse telefone
    const { data: outroCliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', telefoneNormalizado)
      .neq('id', sessao.id)
      .single();

    if (outroCliente) {
      return NextResponse.json(
        { erro: 'Este telefone já está em uso por outro cliente' },
        { status: 409 }
      );
    }

    // Atualizar dados do cliente (sem endereco)
    const { data, error } = await supabase
      .from('clientes')
      .update({
        nome,
        telefone: telefoneNormalizado,
      })
      .eq('id', sessao.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return NextResponse.json(
        { erro: 'Erro ao atualizar dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mensagem: 'Dados atualizados com sucesso',
      cliente: {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone,
      },
    });
  } catch (erro) {
    console.error('Erro ao atualizar:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
