import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/integrations/supabase/client.server';
import { normalizarTelefone } from '@/lib/auth';
import { randomUUID } from 'crypto';
import type { Endereco } from '@/types/endereco';

const registrarSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
  endereco: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados com Zod
    const validacao = registrarSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: validacao.error.format() },
        { status: 400 }
      );
    }

    const { nome, telefone, endereco } = validacao.data;
    const telefoneNormalizado = normalizarTelefone(telefone);

    const supabase = createServerClient();

    // Verificar se o telefone já está cadastrado
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', telefoneNormalizado)
      .single();

    if (clienteExistente) {
      return NextResponse.json(
        { erro: 'Este telefone já está cadastrado' },
        { status: 409 }
      );
    }

    // Parsear o endereço para criar objeto estruturado
    // Formato esperado: "Rua X, 123 - Complemento - Bairro, Cidade/UF - CEP: 12345678"
    const enderecoEstruturado: Endereco = {
      id: randomUUID(),
      apelido: 'Principal',
      logradouro: endereco.split(',')[0]?.trim() || '',
      numero: endereco.split(',')[1]?.split('-')[0]?.trim() || '',
      complemento: endereco.split('-')[1]?.split('-')[0]?.trim() || '',
      bairro: endereco.split('-')[endereco.split('-').length - 2]?.split(',')[0]?.trim() || '',
      cidade: endereco.split(',')[endereco.split(',').length - 1]?.split('/')[0]?.trim() || '',
      estado: endereco.split('/')[1]?.split('-')[0]?.trim() || '',
      cep: endereco.match(/CEP:\s*(\d+)/)?.[1] || '',
      principal: true,
      created_at: new Date().toISOString(),
    };

    // Inserir novo cliente
    const clienteId = randomUUID();
    const { data: novoCliente, error } = await supabase
      .from('clientes')
      .insert({
        id: clienteId,
        nome,
        telefone: telefoneNormalizado,
        endereco,
        enderecos_adicionais: JSON.stringify([enderecoEstruturado]),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar cliente:', error);
      return NextResponse.json(
        { erro: 'Erro ao cadastrar cliente' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        mensagem: 'Cliente cadastrado com sucesso',
        cliente: {
          id: novoCliente.id,
          nome: novoCliente.nome,
          telefone: novoCliente.telefone,
        },
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error('Erro no cadastro:', erro);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
