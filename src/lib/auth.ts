import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { createServerClient } from '@/integrations/supabase/client.server';
import type { Endereco } from '@/types/endereco';

const SECRET_KEY = process.env.AUTH_JWT_SECRET || 'seu-secret-jwt-seguro-aqui';
const secret = new TextEncoder().encode(SECRET_KEY);

export interface ClientePayload {
  id: string;
  nome: string | null;
  telefone: string | null;
  endereco: string | null;
  enderecos_adicionais?: Endereco[];
}

/**
 * Gera um token JWT para o cliente
 */
export async function gerarToken(cliente: ClientePayload): Promise<string> {
  const token = await new SignJWT({
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    endereco: cliente.endereco,
    enderecos_adicionais: cliente.enderecos_adicionais || [],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Token expira em 30 dias
    .sign(secret);

  return token;
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verificarToken(token: string): Promise<ClientePayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as ClientePayload;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

/**
 * Obtém a sessão do cliente autenticado através do cookie
 */
export async function obterSessao(): Promise<ClientePayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  return verificarToken(token);
}

/**
 * Normaliza telefone removendo caracteres não numéricos
 */
export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, '');
}

/**
 * Busca cliente no banco de dados pelo telefone
 */
export async function buscarClientePorTelefone(telefone: string) {
  const supabase = createServerClient();
  const telefoneNormalizado = normalizarTelefone(telefone);

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('telefone', telefoneNormalizado)
    .single();

  if (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }

  return data;
}
