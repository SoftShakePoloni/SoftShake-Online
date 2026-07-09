"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  ShoppingBag,
  LogOut,
  Pencil,
  Plus,
  Star,
  Trash2,
  Phone,
  Calendar,
  Wallet,
  Package,
  CheckCircle2,
  Bell,
  Tag,
  ChevronRight,
  Home,
  Building2,
  Loader2,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/data/tipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

function parseEnderecos(cliente: ClienteFull): Endereco[] {
  const list: Endereco[] = [];

  if (cliente.endereco) {
    const raw = cliente.endereco;
    // tenta parse estruturado "Rua, n - Bairro, Cidade/UF - CEP: x"
    const parts = raw.split(" - ");
    const ruaNum = parts[0] || raw;
    const [logradouro, numero] = ruaNum.split(",").map((s) => s.trim());
    const bairroCidade = parts[1] || "";
    const [bairro, cidadeUf] = bairroCidade.split(",").map((s) => s.trim());
    const [cidade, estado] = (cidadeUf || "").split("/").map((s) => s.trim());
    const cep = raw.match(/CEP:\s*(\d+)/)?.[1] || "";

    list.push({
      id: "endereco-legado",
      apelido: "Principal",
      logradouro: logradouro || raw,
      numero: numero || "",
      complemento: "",
      bairro: bairro || "",
      cidade: cidade || "",
      estado: estado || "",
      cep,
      principal: true,
      created_at: cliente.created_at || new Date().toISOString(),
    });
  }

  let adicionais: Endereco[] = [];
  const rawAdd = cliente.enderecos_adicionais;
  if (Array.isArray(rawAdd)) {
    adicionais = rawAdd as Endereco[];
  } else if (typeof rawAdd === "string") {
    try {
      const p = JSON.parse(rawAdd);
      if (Array.isArray(p)) adicionais = p;
    } catch {
      // ignore
    }
  }

  if (list.length > 0) {
    adicionais = adicionais.map((e) => ({ ...e, principal: false }));
  }

  return [...list, ...adicionais];
}

function initials(nome: string | null) {
  if (!nome) return "CL";
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function addressIcon(apelido: string) {
  const a = apelido.toLowerCase();
  if (a.includes("trab") || a.includes("loja")) return Building2;
  if (a.includes("casa") || a.includes("principal")) return Home;
  return MapPin;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "primary" | "green" | "blue" | "amber";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center mb-3",
          tones[tone]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
        {value}
      </p>
    </div>
  );
}

const PREFS_KEY = "softshake-prefs";

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
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({
    notificacoes: true,
    promocoes: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...prefs, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setNome(cliente.nome || "");
    setTelefone(cliente.telefone || "");
  }, [cliente]);

  const savePrefs = (next: typeof prefs) => {
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    toast.success("Preferências salvas");
  };

  const enderecos = useMemo(() => parseEnderecos(cliente), [cliente]);

  const stats = useMemo(() => {
    const validos = pedidos.filter((p) => p.status !== "cancelado");
    const concluidos = pedidos.filter((p) => p.status === "entregue");
    const totalGasto = validos.reduce((s, p) => s + Number(p.total || 0), 0);
    const ticket = validos.length ? totalGasto / validos.length : 0;
    const ultimo = pedidos[0];
    return {
      pedidos: validos.length,
      totalGasto,
      ticket,
      ultimo,
      concluidos: concluidos.length,
    };
  }, [pedidos]);

  const atividade = useMemo(() => {
    const items: { id: string; text: string; at: string }[] = [];
    for (const p of pedidos.slice(0, 8)) {
      const short = p.id.slice(0, 8).toUpperCase();
      if (p.status === "entregue") {
        items.push({
          id: `${p.id}-done`,
          text: `Pedido #${short} entregue`,
          at: p.updated_at || p.created_at,
        });
      }
      items.push({
        id: `${p.id}-created`,
        text: `Pedido #${short} realizado`,
        at: p.created_at,
      });
    }
    return items
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
  }, [pedidos]);

  const handleSavePerfil = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/clientes/atualizar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.erro || "Erro ao atualizar");
        return;
      }
      toast.success("Dados atualizados");
      setEditOpen(false);
      await onRefresh();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEndereco = async (id: string) => {
    if (id === "endereco-legado") {
      toast.error("O endereço principal não pode ser removido por aqui");
      return;
    }
    setRemovendo(id);
    try {
      const res = await fetch("/api/enderecos/remover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.erro || "Erro ao remover endereço");
        return;
      }
      toast.success("Endereço removido");
      await onRefresh();
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setRemovendo(null);
    }
  };

  const handlePrincipal = async (id: string) => {
    try {
      const res = await fetch("/api/enderecos/principal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.erro || "Erro ao definir principal");
        return;
      }
      toast.success("Endereço principal atualizado");
      await onRefresh();
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const anoCliente = cliente.created_at
    ? format(new Date(cliente.created_at), "yyyy")
    : null;

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-primary/[0.05] via-background to-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 pb-28 space-y-5">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[1.75rem] bg-gradient-to-br from-primary to-violet-500 text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/25 ring-4 ring-white">
              {initials(cliente.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                  {cliente.nome || "Cliente"}
                </h1>
                {anoCliente && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-1 border border-primary/15">
                    Cliente desde {anoCliente}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {cliente.telefone && (
                  <p className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {cliente.telefone}
                  </p>
                )}
                {cliente.created_at && (
                  <p className="inline-flex items-center gap-1.5 sm:ml-0 block">
                    <Calendar className="w-3.5 h-3.5" />
                    Cadastro em{" "}
                    {format(new Date(cliente.created_at), "dd MMM yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 rounded-xl h-10"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Editar perfil
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon={ShoppingBag}
            label="Pedidos realizados"
            value={loadingPedidos ? "…" : String(stats.pedidos)}
          />
          <StatCard
            icon={Wallet}
            label="Total gasto"
            value={loadingPedidos ? "…" : formatBRL(stats.totalGasto)}
            tone="green"
          />
          <StatCard
            icon={Package}
            label="Ticket médio"
            value={loadingPedidos ? "…" : formatBRL(stats.ticket)}
            tone="blue"
          />
          <StatCard
            icon={CheckCircle2}
            label="Concluídos"
            value={loadingPedidos ? "…" : String(stats.concluidos)}
            tone="amber"
          />
          <div className="col-span-2 sm:col-span-2 rounded-3xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">
              Último pedido
            </p>
            {stats.ultimo ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground">
                    #{stats.ultimo.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(stats.ultimo.created_at), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <p className="text-lg font-bold text-primary tabular-nums">
                  {formatBRL(Number(stats.ultimo.total))}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
            )}
          </div>
        </section>

        {/* Dados pessoais */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Dados pessoais
            </h2>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-muted/50 p-3.5">
              <p className="text-[11px] text-muted-foreground mb-0.5">Nome</p>
              <p className="font-semibold text-sm">{cliente.nome || "—"}</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-3.5">
              <p className="text-[11px] text-muted-foreground mb-0.5">Telefone</p>
              <p className="font-semibold text-sm">{cliente.telefone || "—"}</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-3.5 sm:col-span-2">
              <p className="text-[11px] text-muted-foreground mb-0.5">E-mail</p>
              <p className="font-semibold text-sm text-muted-foreground">
                {cliente.email || "Não informado"}
              </p>
            </div>
          </div>
        </section>

        {/* Endereços */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Endereços
            </h2>
            <Link href="/perfil/enderecos/novo">
              <Button size="sm" className="rounded-xl h-10 bg-primary">
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </Link>
          </div>

          {enderecos.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum endereço cadastrado
              </p>
              <Link href="/perfil/enderecos/novo">
                <Button variant="outline" className="rounded-xl">
                  Adicionar endereço
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enderecos.map((end) => {
                const Icon = addressIcon(end.apelido);
                return (
                  <div
                    key={end.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      end.principal
                        ? "border-primary/30 bg-primary/[0.03]"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm">{end.apelido}</p>
                          {end.principal && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                              <Star className="w-3 h-3" />
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {end.logradouro}
                          {end.numero ? `, ${end.numero}` : ""}
                          {end.complemento ? ` — ${end.complemento}` : ""}
                          <br />
                          {end.bairro}
                          {end.cidade ? ` · ${end.cidade}` : ""}
                          {end.estado ? `/${end.estado}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/70">
                      {!end.principal && end.id !== "endereco-legado" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-xl text-xs"
                          onClick={() => handlePrincipal(end.id)}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          Definir principal
                        </Button>
                      )}
                      <Link href="/perfil/enderecos">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-xl text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Gerenciar
                        </Button>
                      </Link>
                      {end.id !== "endereco-legado" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-xl text-xs text-destructive hover:text-destructive"
                          disabled={removendo === end.id}
                          onClick={() => handleRemoveEndereco(end.id)}
                        >
                          {removendo === end.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                          )}
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Preferências */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Preferências
          </h2>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Receber notificações</p>
              <p className="text-xs text-muted-foreground">
                Status de pedidos e atualizações
              </p>
            </div>
            <Switch
              checked={prefs.notificacoes}
              onCheckedChange={(v) =>
                savePrefs({ ...prefs, notificacoes: v })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Receber promoções</p>
                <p className="text-xs text-muted-foreground">
                  Ofertas e novidades da SoftShake
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.promocoes}
              onCheckedChange={(v) => savePrefs({ ...prefs, promocoes: v })}
            />
          </div>
        </section>

        {/* Atividade */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Histórico recente</h2>
            <Link
              href="/pedidos"
              className="text-xs font-semibold text-primary inline-flex items-center"
            >
              Ver pedidos
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {atividade.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sua atividade aparecerá aqui
            </p>
          ) : (
            <ul className="space-y-3">
              {atividade.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.text}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(item.at), "dd MMM yyyy · HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Segurança */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-2">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            Segurança
          </h2>
          <button
            type="button"
            onClick={() =>
              toast.message("Em breve", {
                description: "Alteração de senha estará disponível em breve.",
              })
            }
            className="w-full flex items-center justify-between rounded-2xl border border-border px-4 py-3.5 text-left hover:bg-muted/40 transition"
          >
            <span className="text-sm font-medium">Alterar senha</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() =>
              toast.message("Em breve", {
                description: "Troca de e-mail estará disponível em breve.",
              })
            }
            className="w-full flex items-center justify-between rounded-2xl border border-border px-4 py-3.5 text-left hover:bg-muted/40 transition"
          >
            <span className="text-sm font-medium">Trocar e-mail</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={async () => {
              await onSignOut();
              toast.success("Você saiu da conta");
              router.push("/");
            }}
            className="w-full flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3.5 text-left hover:bg-destructive/10 transition"
          >
            <span className="text-sm font-semibold text-destructive inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sair da conta
            </span>
            <ChevronRight className="w-4 h-4 text-destructive/60" />
          </button>
        </section>

        <Link
          href="/pedidos"
          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Meus pedidos</p>
            <p className="text-xs text-muted-foreground">
              Acompanhar status e histórico
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar dados pessoais</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                className="h-11 mt-1.5 rounded-xl"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tel">Telefone</Label>
              <Input
                id="tel"
                className="h-11 mt-1.5 rounded-xl"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl bg-primary"
              disabled={saving || nome.trim().length < 3}
              onClick={handleSavePerfil}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
