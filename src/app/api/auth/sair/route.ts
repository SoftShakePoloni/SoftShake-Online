import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Remove o cookie de sessão
    cookieStore.delete('session');

    return NextResponse.json({
      mensagem: 'Logout realizado com sucesso',
    });
  } catch (erro) {
    console.error('Erro no logout:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
