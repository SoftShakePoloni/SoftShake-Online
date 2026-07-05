'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function FormularioEndereco() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formData, setFormData] = useState({
    apelido: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    principal: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const resposta = await fetch('/api/enderecos/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!resposta.ok) {
        const dados = await resposta.json();
        toast.error(dados.erro || 'Erro ao adicionar endereço');
        return;
      }

      toast.success('Endereço adicionado!');
      router.push('/perfil/enderecos');
      router.refresh();
    } catch {
      toast.error('Erro ao adicionar endereço');
    } finally {
      setCarregando(false);
    }
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
          setFormData(prev => ({
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Novo Endereço</h1>
        <p className="text-muted-foreground">Adicione um endereço de entrega</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Apelido (Casa, Trabalho...)"
          value={formData.apelido}
          onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
          required
          className="h-14"
          autoFocus
        />

        <Input
          placeholder="CEP"
          value={formData.cep}
          onChange={(e) => handleCepChange(e.target.value)}
          maxLength={8}
          required
          disabled={buscandoCep}
          className="h-14"
        />

        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="Rua"
            value={formData.logradouro}
            onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
            required
            className="h-14 col-span-2"
          />
          <Input
            placeholder="Nº"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            required
            className="h-14"
          />
        </div>

        <Input
          placeholder="Complemento (opcional)"
          value={formData.complemento}
          onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
          className="h-14"
        />

        <Input
          placeholder="Bairro"
          value={formData.bairro}
          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
          required
          className="h-14"
        />

        <div className="grid grid-cols-4 gap-2">
          <Input
            placeholder="Cidade"
            value={formData.cidade}
            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
            required
            className="h-14 col-span-3"
          />
          <Input
            placeholder="UF"
            maxLength={2}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
            required
            className="h-14"
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <Checkbox
            id="principal"
            checked={formData.principal}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, principal: checked as boolean })
            }
          />
          <Label htmlFor="principal" className="cursor-pointer text-sm">
            Definir como endereço principal
          </Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={carregando || buscandoCep} 
            className="flex-1 h-14 text-lg font-semibold"
          >
            {carregando ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={carregando}
            className="h-14"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
