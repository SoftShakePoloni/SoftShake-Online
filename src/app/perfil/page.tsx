"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MeuPerfilView } from "@/components/cliente/perfil/MeuPerfilView";
import type { Endereco } from "@/types/endereco";

type ClienteFull = {
  id: string;
  nome: string | null;
  telefone: string | null;
  endereco: string | null;
  enderecos_adicionais?: Endereco[] | string | null;
  created_at?: string;
  email?: string | null;
};

export default function PaginaPerfil() {
  const { cliente, loading, refreshCliente, signOut } = useAuth();
  const router = useRouter();
  const [fullCliente, setFullCliente] = useState<ClienteFull | null>(null);
  const [loadingFull, setLoadingFull] = useState(true);

  useEffect(() => {
    if (!loading && !cliente) {
      router.push("/entrar");
    }
  }, [loading, cliente, router]);

  useEffect(() => {
    if (!cliente) {
      setLoadingFull(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/sessao");
        if (res.ok) {
          const data = (await res.json()) as { cliente?: ClienteFull };
          if (!cancelled) setFullCliente(data.cliente || (cliente as ClienteFull));
        } else if (!cancelled) {
          setFullCliente(cliente as ClienteFull);
        }
      } catch {
        if (!cancelled) setFullCliente(cliente as ClienteFull);
      } finally {
        if (!cancelled) setLoadingFull(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cliente]);

  if (loading || loadingFull) {
    return (
      <div className="min-h-[70vh] bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-4 animate-pulse">
          <div className="h-40 rounded-[2rem] bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-3xl bg-muted" />
            <div className="h-24 rounded-3xl bg-muted" />
          </div>
          <div className="h-48 rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!cliente || !fullCliente) return null;

  return (
    <MeuPerfilView
      cliente={fullCliente}
      onRefresh={async () => {
        await refreshCliente();
        const res = await fetch("/api/auth/sessao");
        if (res.ok) {
          const data = (await res.json()) as { cliente?: ClienteFull };
          setFullCliente(data.cliente || (cliente as ClienteFull));
        }
      }}
      onSignOut={signOut}
    />
  );
}
