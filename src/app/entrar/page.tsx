'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowRight, Phone } from 'lucide-react';
import Image from 'next/image';

export default function PaginaEntrar() {
  const router = useRouter();
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="https://juzlblaxwybssbyddnwj.supabase.co/storage/v1/object/sign/SoftShake%20Images/Sorveteria/softshake_text.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNmM0NGQwYS0xYmQ0LTRlZmUtYmEzMy02MWIxYmMxYmU2NTYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJTb2Z0U2hha2UgSW1hZ2VzL1NvcnZldGVyaWEvc29mdHNoYWtlX3RleHQucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MzM1NTUxMCwiZXhwIjoyMDk4NzE1NTEwfQ.HxmEfFS02wdQOzkHlR3VMl0Hu3XuiSsdLOByYAOlNJo"
            alt="SoftShake"
            width={200}
            height={60}
            className="h-30 w-auto mb-1"
            priority
          />
        </div>

        {/* Card de Autenticação */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              className="flex-1 py-3 px-4 rounded-2xl bg-primary/10 text-primary font-semibold text-sm"
            >
              Entrar
            </button>
            <button
              onClick={() => router.push('/cadastrar')}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-50 text-gray-500 font-semibold text-sm hover:bg-gray-100 transition"
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="(17) 0000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                  disabled={carregando}
                  className="h-14 pl-12 text-base bg-gray-50 border-0 rounded-2xl"
                  autoFocus
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <Button
              type="submit"
              disabled={carregando}
              className="w-full h-14 text-base font-semibold bg-primary hover:opacity-95 rounded-2xl"
            >
              {carregando ? (
                'Entrando...'
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6 px-4">
          Ao continuar, você concorda com os termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
