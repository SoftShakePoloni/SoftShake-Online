import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obterSessao } from '@/lib/auth';
import { removerEndereco } from '@/lib/endereco';

const removerSchema = z.object({
  enderecoId: z.string().uuid('ID do endereço inválido'),
});

export async function DELETE(request: NextRequest) {
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
    const validacao = removerSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: validacao.error.format() },
        { status: 400 }
      );
    }

    // Remover endereço
    const resultado = await removerEndereco(sessao.id, validacao.data.enderecoId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { erro: resultado.erro || 'Erro ao remover endereço' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mensagem: 'Endereço removido com sucesso',
    });
  } catch (erro) {
    console.error('Erro ao remover endereço:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
