import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obterSessao } from '@/lib/auth';
import { adicionarNovoEndereco } from '@/lib/endereco';

const enderecoSchema = z.object({
  apelido: z.string().min(2, 'Apelido deve ter no mínimo 2 caracteres'),
  logradouro: z.string().min(3, 'Logradouro deve ter no mínimo 3 caracteres'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro deve ter no mínimo 2 caracteres'),
  cidade: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
  cep: z.string().regex(/^\d{8}$/, 'CEP inválido (apenas números)'),
  principal: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
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
    const validacao = enderecoSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: validacao.error.format() },
        { status: 400 }
      );
    }

    // Adicionar endereço
    const resultado = await adicionarNovoEndereco(sessao.id, validacao.data);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { erro: resultado.erro || 'Erro ao adicionar endereço' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mensagem: 'Endereço adicionado com sucesso',
      endereco: resultado.endereco,
    });
  } catch (erro) {
    console.error('Erro ao adicionar endereço:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
