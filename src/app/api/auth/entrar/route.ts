import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { buscarClientePorTelefone, gerarToken, normalizarTelefone } from '@/lib/auth';
import type { Endereco } from '@/types/endereco';

const entrarSchema = z.object({
  telefone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados com Zod
    const validacao = entrarSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { erro: 'Telefone inválido', detalhes: validacao.error.format() },
        { status: 400 }
      );
    }

    const { telefone } = validacao.data;
    const telefoneNormalizado = normalizarTelefone(telefone);

    // Buscar cliente pelo telefone
    const cliente = await buscarClientePorTelefone(telefoneNormalizado);

    if (!cliente) {
      return NextResponse.json(
        { erro: 'Cliente não encontrado. Por favor, cadastre-se primeiro.' },
        { status: 404 }
      );
    }

    // Gerar token JWT
    // Forçamos a conversão de tipo para resolver o conflito com o tipo Json do Supabase
    const token = await gerarToken({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      enderecos_adicionais: (cliente.enderecos_adicionais as unknown as Endereco[]) || [],
    });

    // Definir cookie de sessão
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    });

    return NextResponse.json({
      mensagem: 'Login realizado com sucesso',
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
      },
    });
  } catch (erro) {
    console.error('Erro no login:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}