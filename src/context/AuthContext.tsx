"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ClienteData = {
  id: string;
  nome: string | null;
  telefone: string | null;
  endereco: string | null;
};

type AuthContextType = {
  user: ClienteData | null;
  session: { user: ClienteData } | null;
  cliente: ClienteData | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  refreshCliente: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verifica se precisa completar perfil
  const needsProfileCompletion = Boolean(
    cliente && (!cliente.nome || !cliente.telefone || !cliente.endereco)
  );

  // Busca a sessão do cliente via API
  const fetchSessao = async () => {
    try {
      const resposta = await fetch('/api/auth/sessao');
      
      if (resposta.ok) {
        const dados = await resposta.json();
        if (dados.cliente) {
          setCliente(dados.cliente);
        } else {
          setCliente(null);
        }
      } else {
        setCliente(null);
      }
    } catch {
      toast.error('Erro ao buscar sessão');
      setCliente(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para rebuscar cliente (usar após atualizar perfil)
  const refreshCliente = async () => {
    await fetchSessao();
  };

  // Função de logout
  const signOut = async () => {
    try {
      await fetch('/api/auth/sair', { method: 'POST' });
      setCliente(null);
      
      // Limpa o carrinho do localStorage
      localStorage.removeItem('carrinho-itens');
      localStorage.removeItem('carrinho-cupom');
      
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Erro ao fazer logout');
    }
  };

  // Carrega sessão ao montar
  useEffect(() => {
    fetchSessao();
  }, []);

  // Cria objeto session compatível com o código existente
  const session = cliente ? { user: cliente } : null;

  return (
    <AuthContext.Provider
      value={{
        user: cliente,
        session,
        cliente,
        loading,
        needsProfileCompletion,
        refreshCliente,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
