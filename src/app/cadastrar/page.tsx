'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowRight, User, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

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

    // Validação básica de telefone
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
      toast.error('Telefone deve ter no mínimo 10 dígitos');
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

      // Se telefone já existe (409), faz login automaticamente
      if (resposta.status === 409) {
        toast.loading('Telefone já cadastrado! Fazendo login...', {
          duration: 2000,
        });

        // Aguarda um pouco para o usuário ver a mensagem
        await new Promise(resolve => setTimeout(resolve, 800));

        const loginResposta = await fetch('/api/auth/entrar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telefone: formData.telefone }),
        });

        if (loginResposta.ok) {
          toast.success('Login realizado com sucesso!');
          
          // Se veio da sacola, mantém o fluxo
          const shouldReopen = sessionStorage.getItem('reopenCart');
          if (shouldReopen === 'true') {
            window.location.href = '/';
          } else {
            window.location.href = '/';
          }
        } else {
          toast.error('Erro ao fazer login. Tente novamente na tela de login.');
          router.push('/entrar');
        }
        return;
      }

      if (!resposta.ok) {
        toast.error(dados.erro || 'Erro ao cadastrar');
        return;
      }

      // Cadastro novo realizado com sucesso
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
        toast.success('Cadastro realizado com sucesso! Fazendo login...');
        
        // Faz login automaticamente após cadastro
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
          router.push('/entrar');
        }
      }
    } catch {
      toast.error('Erro ao cadastrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
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
              onClick={() => router.push('/entrar')}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-50 text-gray-500 font-semibold text-sm hover:bg-gray-100 transition"
            >
              Entrar
            </button>
            <button
              className="flex-1 py-3 px-4 rounded-2xl bg-primary/10 text-primary font-semibold text-sm"
            >
              Cadastrar
            </button>
          </div>

          {step === 'dados' ? (
            <form onSubmit={handleAvancarParaEndereco} className="space-y-6">
              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="nome"
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="h-14 pl-12 text-base bg-gray-50 border-0 rounded-2xl"
                    autoFocus
                  />
                </div>
              </div>

              {/* Campo Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="telefone"
                    type="tel"
                    placeholder="(17) 0000-0000"
                    value={formData.telefone}
                    onChange={handleChange}
                    required
                    className="h-14 pl-12 text-base bg-gray-50 border-0 rounded-2xl"
                  />
                </div>
              </div>

              {/* Botão Continuar */}
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold bg-primary hover:opacity-95 rounded-2xl"
              >
                Continuar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo CEP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    disabled={carregando || buscandoCep}
                    maxLength={8}
                    required
                    className="h-14 pl-12 text-base bg-gray-50 border-0 rounded-2xl"
                    autoFocus
                  />
                </div>
              </div>

              {/* Rua e Número */}
              <div className="grid grid-cols-3 gap-3">
                <Input
                  name="logradouro"
                  placeholder="Rua"
                  value={formData.logradouro}
                  onChange={handleChange}
                  disabled={carregando}
                  required
                  className="h-14 col-span-2 text-base bg-gray-50 border-0 rounded-2xl"
                />
                <Input
                  name="numero"
                  placeholder="Nº"
                  value={formData.numero}
                  onChange={handleChange}
                  disabled={carregando}
                  required
                  className="h-14 text-base bg-gray-50 border-0 rounded-2xl"
                />
              </div>

              {/* Complemento */}
              <Input
                name="complemento"
                placeholder="Complemento (opcional)"
                value={formData.complemento}
                onChange={handleChange}
                disabled={carregando}
                className="h-14 text-base bg-gray-50 border-0 rounded-2xl"
              />

              {/* Bairro */}
              <Input
                name="bairro"
                placeholder="Bairro"
                value={formData.bairro}
                onChange={handleChange}
                disabled={carregando}
                required
                className="h-14 text-base bg-gray-50 border-0 rounded-2xl"
              />

              {/* Cidade e Estado */}
              <div className="grid grid-cols-4 gap-3">
                <Input
                  name="cidade"
                  placeholder="Cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  disabled={carregando}
                  required
                  className="h-14 col-span-3 text-base bg-gray-50 border-0 rounded-2xl"
                />
                <Input
                  name="estado"
                  placeholder="UF"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={carregando}
                  maxLength={2}
                  required
                  className="h-14 text-base bg-gray-50 border-0 rounded-2xl"
                />
              </div>

              {/* Botões */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={carregando || buscandoCep}
                  className="w-full h-14 text-base font-semibold bg-primary hover:opacity-95 rounded-2xl"
                >
                  {carregando ? (
                    'Cadastrando...'
                  ) : (
                    <>
                      Cadastrar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('dados')}
                  disabled={carregando}
                  className="w-full h-12 text-base text-gray-500 hover:text-gray-700 rounded-2xl"
                >
                  Voltar
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6 px-4">
          Ao continuar, você concorda com os termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
