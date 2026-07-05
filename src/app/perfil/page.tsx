'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, MapPin, ShoppingBag, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function PaginaPerfil() {
  const { cliente, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !cliente) {
      router.push('/entrar');
    }
  }, [loading, cliente, router]);

  if (loading) {
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
            <User className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{cliente.nome}</h1>
          <p className="text-muted-foreground">{cliente.telefone}</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/perfil/enderecos"
            className="flex items-center gap-4 p-6 bg-card rounded-2xl border-2 hover:border-primary transition"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Endereços</h3>
              <p className="text-sm text-muted-foreground">Gerenciar endereços de entrega</p>
            </div>
          </Link>

          <Link
            href="/pedidos"
            className="flex items-center gap-4 p-6 bg-card rounded-2xl border-2 hover:border-primary transition"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Meus Pedidos</h3>
              <p className="text-sm text-muted-foreground">Acompanhar pedidos realizados</p>
            </div>
          </Link>

          <button
            onClick={signOut}
            className="flex items-center gap-4 p-6 bg-card rounded-2xl border-2 hover:border-destructive transition w-full text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-destructive">Sair</h3>
              <p className="text-sm text-muted-foreground">Fazer logout da conta</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
