'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function PaginaEntrar() {
  const [telefone, setTelefone] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const resposta = await fetch('/api/auth/entrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefone }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        toast.error(dados.erro || 'Erro ao fazer login');
        return;
      }

      toast.success('Login realizado com sucesso!');
      window.location.href = '/';
    } catch {
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-3">SoftShake</h1>
          <p className="text-muted-foreground text-sm">Entre com seu telefone</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="tel"
            placeholder="Telefone (11999999999)"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
            disabled={carregando}
            className="h-14 text-center text-lg"
            autoFocus
          />

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold" 
            disabled={carregando}
          >
            {carregando ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <div className="text-center pt-2">
            <Link href="/cadastrar" className="text-sm text-muted-foreground hover:text-primary transition">
              Não tem conta? <span className="font-semibold">Cadastre-se</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
