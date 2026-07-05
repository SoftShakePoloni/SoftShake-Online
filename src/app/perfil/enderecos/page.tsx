'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Endereco } from '@/types/endereco';

export default function PaginaEnderecos() {
  const { cliente, loading } = useAuth();
  const router = useRouter();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [removendo, setRemovendo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !cliente) {
      router.push('/entrar');
    }
  }, [loading, cliente, router]);

  useEffect(() => {
    const carregarEnderecos = async () => {
      if (!cliente) return;

      try {
        const resposta = await fetch('/api/auth/sessao');
        
        if (resposta.ok) {
          const dados = await resposta.json();
          
          let enderecosCarregados: Endereco[] = [];
          
          if (dados.cliente?.enderecos_adicionais) {
            if (Array.isArray(dados.cliente.enderecos_adicionais)) {
              enderecosCarregados = dados.cliente.enderecos_adicionais as Endereco[];
            } else if (typeof dados.cliente.enderecos_adicionais === 'string') {
              try {
                const parsed = JSON.parse(dados.cliente.enderecos_adicionais);
                if (Array.isArray(parsed)) {
                  enderecosCarregados = parsed as Endereco[];
                }
              } catch {
                // Ignora erro
              }
            }
          }
          
          if (enderecosCarregados.length === 0 && dados.cliente?.endereco) {
            enderecosCarregados.push({
              id: 'endereco-principal',
              apelido: 'Principal',
              logradouro: dados.cliente.endereco.split(',')[0]?.trim() || '',
              numero: dados.cliente.endereco.split(',')[1]?.split('-')[0]?.trim() || '',
              complemento: '',
              bairro: dados.cliente.endereco.split('-')[1]?.split(',')[0]?.trim() || '',
              cidade: dados.cliente.endereco.split(',')[2]?.split('/')[0]?.trim() || '',
              estado: dados.cliente.endereco.split('/')[1]?.split('-')[0]?.trim() || '',
              cep: dados.cliente.endereco.match(/CEP:\s*(\d+)/)?.[1] || '',
              principal: true,
              created_at: new Date().toISOString(),
            });
          }
          
          setEnderecos(enderecosCarregados);
        }
      } catch {
        toast.error('Erro ao carregar endereços');
      } finally {
        setCarregando(false);
      }
    };

    if (cliente) {
      carregarEnderecos();
    }
  }, [cliente]);

  const handleRemover = async (enderecoId: string) => {
    setRemovendo(enderecoId);
    
    try {
      const resposta = await fetch('/api/enderecos/remover', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enderecoId }),
      });

      if (!resposta.ok) {
        toast.error('Erro ao remover endereço');
        return;
      }

      toast.success('Endereço removido!');
      setEnderecos(enderecos.filter(e => e.id !== enderecoId));
    } catch {
      toast.error('Erro ao remover endereço');
    } finally {
      setRemovendo(null);
    }
  };

  const handleDefinirPrincipal = async (enderecoId: string) => {
    try {
      const resposta = await fetch('/api/enderecos/principal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enderecoId }),
      });

      if (!resposta.ok) {
        toast.error('Erro ao atualizar endereço');
        return;
      }

      toast.success('Endereço principal atualizado!');
      setEnderecos(enderecos.map(e => ({
        ...e,
        principal: e.id === enderecoId,
      })));
    } catch {
      toast.error('Erro ao atualizar endereço');
    }
  };

  if (loading || carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Endereços</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus endereços de entrega</p>
          </div>
          <Link href="/perfil/enderecos/novo">
            <Button size="lg" className="rounded-full">
              <Plus className="w-5 h-5 mr-2" />
              Novo
            </Button>
          </Link>
        </div>

        {enderecos.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-6">Adicione um endereço para facilitar suas entregas</p>
            <Link href="/perfil/enderecos/novo">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Endereço
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enderecos.map((endereco) => (
              <div
                key={endereco.id}
                className="relative p-6 bg-card rounded-2xl border-2 hover:border-primary/50 transition"
              >
                {endereco.principal && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                      <Star className="w-3 h-3 fill-current" />
                      Principal
                    </div>
                  </div>
                )}

                <div className="pr-20">
                  <h3 className="font-semibold text-lg mb-2">{endereco.apelido}</h3>
                  <p className="text-sm text-muted-foreground">
                    {endereco.logradouro}, {endereco.numero}
                    {endereco.complemento && ` - ${endereco.complemento}`}
                    <br />
                    {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                    <br />
                    CEP: {endereco.cep}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  {!endereco.principal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDefinirPrincipal(endereco.id)}
                      className="flex-1"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Tornar Principal
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemover(endereco.id)}
                    disabled={removendo === endereco.id}
                    className={!endereco.principal ? '' : 'flex-1'}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
