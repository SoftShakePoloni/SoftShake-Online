'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Step = 'dados' | 'endereco';

export default function PaginaCadastrar() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('dados');
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  const [carregando, setCarregando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCepChange = async (cep: string) => {
    const cepNumeros = cep.replace(/\D/g, '');
    setFormData({ ...formData, cep: cepNumeros });

    if (cepNumeros.length === 8) {
      setBuscandoCep(true);
      try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`);
        const dados = await resposta.json();

        if (!dados.erro) {
          setFormData((prev) => ({
            ...prev,
            logradouro: dados.logradouro || prev.logradouro,
            bairro: dados.bairro || prev.bairro,
            cidade: dados.localidade || prev.cidade,
            estado: dados.uf || prev.estado,
          }));
          toast.success('CEP encontrado!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch {
        toast.error('Erro ao buscar CEP');
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleAvancarParaEndereco = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha todos os campos');
      return;
    }

    setStep('endereco');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const enderecoCompleto = `${formData.logradouro}, ${formData.numero}${formData.complemento ? ' - ' + formData.complemento : ''} - ${formData.bairro}, ${formData.cidade}/${formData.estado} - CEP: ${formData.cep}`;

      const resposta = await fetch('/api/auth/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: enderecoCompleto,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 409) {
          toast.error('Este telefone já está cadastrado. Faça login!', {
            duration: 4000,
          });
          setTimeout(() => {
            router.push('/entrar');
          }, 2000);
          return;
        }
        
        toast.error(dados.erro || 'Erro ao cadastrar');
        return;
      }

      const shouldReopen = sessionStorage.getItem('reopenCart');
      
      if (shouldReopen === 'true') {
        toast.success('Cadastro realizado! Fazendo login...');
        
        const loginResposta = await fetch('/api/auth/entrar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telefone: formData.telefone }),
        });

        if (loginResposta.ok) {
          window.location.href = '/';
        } else {
          toast.error('Erro ao fazer login. Por favor, entre manualmente.');
          sessionStorage.removeItem('reopenCart');
          sessionStorage.removeItem('cartStep');
          router.push('/entrar');
        }
      } else {
        toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
        router.push('/entrar');
      }
    } catch {
      toast.error('Erro ao cadastrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-3">SoftShake</h1>
          <p className="text-muted-foreground text-sm">
            {step === 'dados' ? 'Crie sua conta' : 'Seu endereço'}
          </p>
        </div>

        {step === 'dados' ? (
          <form onSubmit={handleAvancarParaEndereco} className="space-y-4">
            <Input
              name="nome"
              placeholder="Nome completo"
              value={formData.nome}
              onChange={handleChange}
              required
              className="h-14"
              autoFocus
            />

            <Input
              name="telefone"
              type="tel"
              placeholder="Telefone (11999999999)"
              value={formData.telefone}
              onChange={handleChange}
              required
              className="h-14"
            />

            <Button type="submit" className="w-full h-14 text-lg font-semibold">
              Continuar
            </Button>

            <div className="text-center pt-2">
              <Link href="/entrar" className="text-sm text-muted-foreground hover:text-primary transition">
                Já tem conta? <span className="font-semibold">Entre aqui</span>
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="cep"
              placeholder="CEP"
              value={formData.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              disabled={carregando || buscandoCep}
              maxLength={8}
              required
              className="h-14"
              autoFocus
            />

            <div className="grid grid-cols-3 gap-2">
              <Input
                name="logradouro"
                placeholder="Rua"
                value={formData.logradouro}
                onChange={handleChange}
                disabled={carregando}
                required
                className="h-14 col-span-2"
              />
              <Input
                name="numero"
                placeholder="Nº"
                value={formData.numero}
                onChange={handleChange}
                disabled={carregando}
                required
                className="h-14"
              />
            </div>

            <Input
              name="complemento"
              placeholder="Complemento (opcional)"
              value={formData.complemento}
              onChange={handleChange}
              disabled={carregando}
              className="h-14"
            />

            <Input
              name="bairro"
              placeholder="Bairro"
              value={formData.bairro}
              onChange={handleChange}
              disabled={carregando}
              required
              className="h-14"
            />

            <div className="grid grid-cols-4 gap-2">
              <Input
                name="cidade"
                placeholder="Cidade"
                value={formData.cidade}
                onChange={handleChange}
                disabled={carregando}
                required
                className="h-14 col-span-3"
              />
              <Input
                name="estado"
                placeholder="UF"
                value={formData.estado}
                onChange={handleChange}
                disabled={carregando}
                maxLength={2}
                required
                className="h-14"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold" 
              disabled={carregando || buscandoCep}
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('dados')}
              disabled={carregando}
              className="w-full"
            >
              Voltar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
