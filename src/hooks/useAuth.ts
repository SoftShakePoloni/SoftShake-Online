'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string | null;
  telefone: string | null;
  endereco: string | null;
}

export function useAuth() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  const verificarSessao = async () => {
    try {
      const resposta = await fetch('/api/auth/sessao');
      
      if (resposta.ok) {
        const dados = await resposta.json();
        setCliente(dados.cliente);
      } else {
        setCliente(null);
      }
    } catch (erro) {
      console.error('Erro ao verificar sessão:', erro);
      setCliente(null);
    } finally {
      setCarregando(false);
    }
  };

  const sair = async () => {
    try {
      const resposta = await fetch('/api/auth/sair', {
        method: 'POST',
      });

      if (resposta.ok) {
        setCliente(null);
        toast.success('Logout realizado com sucesso!');
        router.push('/entrar');
        router.refresh();
      }
    } catch (erro) {
      console.error('Erro ao fazer logout:', erro);
      toast.error('Erro ao fazer logout');
    }
  };

  useEffect(() => {
    verificarSessao();
  }, []);

  return {
    cliente,
    carregando,
    autenticado: !!cliente,
    sair,
    recarregar: verificarSessao,
  };
}
