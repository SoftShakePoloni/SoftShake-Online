"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  ShoppingBag,
  LogOut,
  Pencil,
  Settings2,
  ChevronRight,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import type { Endereco } from "@/types/endereco";
import { useClientePedidos } from "@/hooks/useClientePedidos";

type ClienteFull = {
  id: string;
  nome: string | null;
  telefone: string | null;
  endereco: string | null;
  enderecos_adicionais?: Endereco[] | string | null;
  created_at?: string;
  email?: string | null;
};

function initials(nome: string | null) {
  if (!nome) return "CL";
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type MenuItem = {
  href?: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  onClick?: () => void;
  danger?: boolean;
};

export function MeuPerfilView({
  cliente,
  onSignOut,
}: {
  cliente: ClienteFull;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const router = useRouter();
  const { pedidos, loading: loadingPedidos } = useClientePedidos(cliente.id);
  const pedidosCount = pedidos.filter((p) => p.status !== "cancelado").length;

  const menuItems: MenuItem[] = [
    {
      label: "Dados pessoais",
      description: "Nome e telefone",
      icon: User,
      onClick: () => router.push("/perfil/dados-pessoais"),
    },
    {
      href: "/perfil/enderecos",
      label: "Endereços",
      description: "Onde receber seus pedidos",
      icon: MapPin,
    },
    {
      href: "/pedidos",
      label: "Meus pedidos",
      description: loadingPedidos
        ? "Carregando…"
        : pedidosCount === 0
          ? "Nenhum pedido ainda"
          : `${pedidosCount} pedido${pedidosCount === 1 ? "" : "s"}`,
      icon: ShoppingBag,
    },
    {
      href: "/perfil/preferencias",
      label: "Preferências",
      description: "Notificações e promoções",
      icon: Settings2,
    },
  ];

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-primary/[0.04] via-background to-background">
      <div className="mx-auto max-w-lg px-4 py-8 pb-28 space-y-6">
        {/* Header compacto */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-background">
              {initials(cliente.nome)}
            </div>
            <button
              type="button"
              onClick={() => router.push("/perfil/dados-pessoais")}
              className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
              aria-label="Editar perfil"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {cliente.nome || "Cliente"}
          </h1>
          {cliente.telefone ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {cliente.telefone}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/perfil/dados-pessoais")}
              className="mt-1 text-sm font-medium text-primary"
            >
              Adicionar telefone
            </button>
          )}
        </motion.section>

        {/* Menu */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <ul className="divide-y divide-border">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              );

              const className =
                "flex w-full items-center gap-3 px-4 py-3.5 transition hover:bg-muted/50 active:bg-muted/70";

              if (item.href) {
                return (
                  <li key={item.label}>
                    <Link href={item.href} className={className}>
                      {content}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={className}
                  >
                    {content}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.section>

        {/* Sair */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            type="button"
            onClick={async () => {
              await onSignOut();
              toast.success("Você saiu da conta");
              router.push("/");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </motion.div>
      </div>
    </div>
  );
}
