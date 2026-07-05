import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obterSessao } from '@/lib/auth';
import { definirEnderecoPrincipal } from '@/lib/endereco';

const principalSchema = z.object({
  enderecoId: z.string().uuid('ID do endereço inválido'),
});

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessao = await obterSessao();
    
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validacao = principalSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: validacao.error.format() },
        { status: 400 }
      );
    }

    // Definir como principal
    const resultado = await definirEnderecoPrincipal(sessao.id, validacao.data.enderecoId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { erro: resultado.erro || 'Erro ao definir endereço principal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mensagem: 'Endereço principal definido com sucesso',
    });
  } catch (erro) {
    console.error('Erro ao definir endereço principal:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
