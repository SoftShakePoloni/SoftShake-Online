"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  ShoppingBag,
  LogOut,
  Pencil,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { formatPhone } from "@/lib/utils/formatters";
import type { Endereco } from "@/types/endereco";
import { useModalHistory } from "@/hooks/useModalHistory";
import { useClientePedidos } from "@/hooks/useClientePedidos";
import "./profile.css";

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
  return (
    nome
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "CL"
  );
}
export function MeuPerfilView({
  cliente,
  onRefresh,
  onSignOut,
}: {
  cliente: ClienteFull;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const router = useRouter();
  const { pedidos, loading: loadingPedidos } = useClientePedidos(cliente.id);
  const [editOpen, setEditOpen] = useState(false);
  const [nome, setNome] = useState(cliente.nome || "");
  const [telefone, setTelefone] = useState(cliente.telefone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const savingRef = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!editOpen) {
      setNome(cliente.nome || "");
      setTelefone(cliente.telefone || "");
    }
  }, [cliente, editOpen]);
  const dirty =
    nome !== (cliente.nome || "") ||
    telefone.replace(/\D/g, "") !== (cliente.telefone || "").replace(/\D/g, "");
  const changeOpen = (open: boolean) => {
    if (savingRef.current) return;
    if (!open && dirty) {
      setDiscardOpen(true);
      return;
    }
    if (open) setError("");
    setEditOpen(open);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/clientes/atualizar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.erro || "Não foi possível salvar seus dados. Tente novamente.",
        );
        return;
      }
      toast.success("Dados atualizados");
      setEditOpen(false);
      await onRefresh();
    } catch {
      setError(
        "Não foi possível salvar seus dados. Confira sua conexão e tente novamente.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  useModalHistory(editOpen, (open) => {
    if (!open && (dirty || savingRef.current)) {
      history.forward();
      if (!savingRef.current) setDiscardOpen(true);
      return;
    }
    changeOpen(open);
  });
  const count = pedidos.filter((p) => p.status !== "cancelado").length;
  const items = [
    {
      label: "Dados pessoais",
      description: "Nome e telefone",
      icon: User,
      onClick: () => changeOpen(true),
    },
    {
      label: "Meus endereços",
      description: "Seus locais de entrega",
      icon: MapPin,
      href: "/perfil/enderecos",
    },
    {
      label: "Meus pedidos",
      description: loadingPedidos
        ? "Carregando…"
        : count
          ? `${count} pedido${count === 1 ? "" : "s"}`
          : "Acompanhe seus pedidos",
      icon: ShoppingBag,
      href: "/pedidos",
    },
  ];
  return (
    <div className="customer-account mx-auto min-h-[70vh] max-w-lg px-5 pb-28 pt-7 sm:pt-10">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Meu perfil</h1>
      <header className="flex items-center gap-3 border-b border-border pb-6">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
        >
          {initials(cliente.nome)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-base font-semibold">
            {cliente.nome || "Cliente"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {cliente.telefone
              ? formatPhone(cliente.telefone)
              : "Telefone não informado"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => changeOpen(true)}
          aria-label="Editar dados pessoais"
          title="Editar dados pessoais"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Pencil size={17} />
        </button>
      </header>
      <nav aria-label="Minha conta">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.label}>
              {(() => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon
                      aria-hidden="true"
                      size={19}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      size={16}
                      className="text-muted-foreground"
                    />
                  </>
                );
                const style =
                  "flex min-h-[72px] w-full items-center gap-3 rounded-md py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
                return item.href ? (
                  <Link href={item.href} className={style}>
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={style}
                    onClick={item.onClick}
                  >
                    {content}
                  </button>
                );
              })()}
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          if (signingOut) return;
          setSigningOut(true);
          try {
            await onSignOut();
            toast.success("Você saiu da conta");
            router.push("/");
          } catch {
            toast.error("Não foi possível sair. Tente novamente.");
          } finally {
            setSigningOut(false);
          }
        }}
        className="mt-5 inline-flex min-h-11 items-center gap-3 rounded-md pr-4 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
      >
        <LogOut size={18} aria-hidden="true" />
        Sair da conta
      </button>
      <Dialog open={editOpen} onOpenChange={changeOpen}>
        <DialogContent
          className="profile-edit-dialog"
          overlayClassName="bg-black/25"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            heading.current?.focus({ preventScroll: true });
          }}
        >
          <DialogHeader className="text-left">
            <DialogTitle
              ref={heading}
              tabIndex={-1}
              className="focus:outline-none"
            >
              Dados pessoais
            </DialogTitle>
            <DialogDescription>
              Como você quer ser chamado e seu telefone de contato.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input
                id="profile-name"
                autoComplete="name"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                minLength={3}
                maxLength={120}
                required
                disabled={saving}
                className="h-11 rounded-lg border-input shadow-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Telefone</Label>
              <Input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={formatPhone(telefone)}
                onChange={(event) =>
                  setTelefone(
                    event.target.value.replace(/\D/g, "").slice(0, 11),
                  )
                }
                required
                disabled={saving}
                className="h-11 rounded-lg border-input shadow-none"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={saving || nome.trim().length < 3 || !dirty}
              className="min-h-11 w-full rounded-lg"
            >
              {saving && (
                <Loader2
                  aria-hidden="true"
                  size={16}
                  className="mr-2 animate-spin"
                />
              )}
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações nos seus dados ainda não foram salvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditOpen(false);
                setDiscardOpen(false);
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
