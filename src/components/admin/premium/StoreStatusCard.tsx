"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Settings,
  Timer,
  Zap,
  Store,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  normalizeConfiguracao,
  type ConfiguracaoLoja,
} from "@/types/configuracoes";
import { useConfiguracoesLojaRealtime } from "@/hooks/useConfiguracoesLojaRealtime";
import {
  calcularFuncionamento,
  formatarTempoMedio,
} from "@/lib/admin/horario-loja";
import { setLojaAberta } from "@/actions/admin/configuracoes";
import { toast } from "sonner";

interface StoreStatusCardProps {
  configInicial?: ConfiguracaoLoja | null;
  /** Admin com config:write — pode abrir/fechar a loja */
  canManageStore?: boolean;
  /** Tem acesso à tela de configurações */
  canOpenConfig?: boolean;
  /** Sidebar recolhida: só logo + status */
  collapsed?: boolean;
}

function StoreStatusSkeleton() {
  return (
    <div className="mx-3 mt-3 mb-1 rounded-2xl border border-[#E5E7EB] bg-white p-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E5E7EB]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-24 bg-[#E5E7EB] rounded" />
          <div className="h-2.5 w-16 bg-[#F3F4F6] rounded" />
        </div>
        <div className="w-4 h-4 bg-[#E5E7EB] rounded" />
      </div>
    </div>
  );
}

function StatusRow({
  icon,
  iconWrap,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconWrap: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 py-2.5">
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          iconWrap
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#111827] leading-tight">
          {title}
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}

export function StoreStatusCard({
  configInicial,
  canManageStore = false,
  canOpenConfig = false,
  collapsed = false,
}: StoreStatusCardProps) {
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { config, loading, status, patchConfig, replaceConfig } =
    useConfiguracoesLojaRealtime(configInicial ?? null);

  const funcionamento = useMemo(
    () =>
      calcularFuncionamento({
        horario_abertura: config?.horario_abertura,
        horario_fechamento: config?.horario_fechamento,
        dias_funcionamento: config?.dias_funcionamento,
        esta_aberto: config?.esta_aberto,
      }),
    [config]
  );

  const lojaAberta = Boolean(config?.esta_aberto);
  const aceitando =
    config?.aceitando_pedidos !== undefined
      ? Boolean(config.aceitando_pedidos)
      : lojaAberta;
  const autoAceite = Boolean(config?.aceitar_pedidos_automaticamente);

  const statusLabel = lojaAberta ? "Loja aberta" : "Loja fechada";
  const statusDot = lojaAberta ? "bg-emerald-500" : "bg-red-400";

  const handleToggleLoja = useCallback(async () => {
    if (!canManageStore) {
      toast.error("Sem permissão", {
        description: "Apenas administradores podem abrir ou fechar a loja.",
      });
      return;
    }
    if (!config?.id || toggling) return;
    const next = !lojaAberta;
    setToggling(true);
    patchConfig({
      esta_aberto: next,
      aceitando_pedidos: next,
    });

    try {
      const updated = await setLojaAberta(next);
      replaceConfig(normalizeConfiguracao(updated as Record<string, unknown>));
      toast.success(next ? "Loja aberta" : "Loja fechada", {
        description: next
          ? "Você está recebendo pedidos"
          : "Pedidos não serão aceitos",
      });
    } catch (e) {
      console.error(e);
      patchConfig({
        esta_aberto: lojaAberta,
        aceitando_pedidos: aceitando,
      });
      const msg =
        e instanceof Error ? e.message : "Não foi possível atualizar o status da loja";
      toast.error("Não foi possível atualizar o status da loja", {
        description: msg,
      });
    } finally {
      setToggling(false);
    }
  }, [
    canManageStore,
    config?.id,
    toggling,
    lojaAberta,
    aceitando,
    patchConfig,
    replaceConfig,
  ]);

  if (loading && !config) {
    return collapsed ? (
      <div className="mx-2 mt-3 mb-1 flex justify-center">
        <div className="w-10 h-10 rounded-full bg-[#E5E7EB] animate-pulse" />
      </div>
    ) : (
      <StoreStatusSkeleton />
    );
  }

  if (!config) {
    if (collapsed) {
      return (
        <div className="mx-2 mt-3 mb-1 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
            <Store className="w-4 h-4 text-[#9CA3AF]" />
          </div>
        </div>
      );
    }
    return (
      <div className="mx-3 mt-3 mb-1 rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-3 text-center">
        <p className="text-xs text-[#6B7280]">Loja não configurada</p>
        {canOpenConfig && (
          <Link
            href="/admin/configuracoes"
            className="text-xs font-semibold text-[#4C258C] hover:underline"
          >
            Configurar agora
          </Link>
        )}
      </div>
    );
  }

  const tempoMedio = formatarTempoMedio(
    config.tempo_entrega_min,
    config.tempo_entrega_max
  );

  return (
    <div className={cn(collapsed ? "mx-2 mt-3 mb-1" : "mx-3 mt-3 mb-1")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full group flex items-center rounded-2xl border border-[#E5E7EB] bg-white",
              "text-left cursor-pointer transition-all duration-200",
              "hover:border-[#D4C4F0] hover:shadow-md hover:shadow-[#4C258C]/5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/35",
              open && "border-[#4C258C]/40 shadow-md shadow-[#4C258C]/8",
              collapsed ? "justify-center p-2" : "gap-3 p-3"
            )}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={`Status da loja: ${config.nome}, ${statusLabel}`}
            title={collapsed ? `${config.nome} · ${statusLabel}` : undefined}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#4C258C] to-[#7C3AED] shrink-0 ring-2 ring-white shadow-sm">
              {config.logo_url ? (
                <Image
                  src={config.logo_url}
                  alt={`Logo ${config.nome}`}
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  {config.nome.charAt(0).toUpperCase()}
                </span>
              )}
              <span
                className={cn(
                  "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white",
                  statusDot
                )}
              />
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate leading-tight">
                    {config.nome}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] font-medium mt-0.5 flex items-center gap-1.5",
                      lojaAberta ? "text-emerald-600" : "text-red-500"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        statusDot,
                        lojaAberta && "animate-pulse"
                      )}
                    />
                    {statusLabel}
                  </p>
                </div>

                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="text-[#9CA3AF] group-hover:text-[#4C258C] transition-colors"
                >
                  <ChevronDown className="w-4 h-4" aria-hidden />
                </motion.span>
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          className={cn(
            "w-[min(420px,calc(100vw-2rem))] p-0 overflow-hidden",
            "rounded-2xl border border-[#E5E7EB] bg-white",
            "shadow-xl shadow-black/10",
            "z-[100]"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {/* Header */}
                <div className="flex items-start gap-3 p-4 border-b border-[#F3F4F6]">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#4C258C] to-[#7C3AED] shrink-0">
                    {config.logo_url ? (
                      <Image
                        src={config.logo_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                        {config.nome.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h2 className="text-base font-bold text-[#111827] truncate">
                      {config.nome}
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">
                      {config.descricao || "Sorveteria • Açaiteria"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
                    aria-label="Fechar painel da loja"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-4 pt-2 pb-1">
                  <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        status === "live"
                          ? "bg-emerald-500 animate-pulse"
                          : status === "error"
                            ? "bg-red-400"
                            : "bg-blue-400"
                      )}
                    />
                    Essas informações são atualizadas automaticamente em tempo
                    real.
                  </p>
                </div>

                {/* Status list */}
                <div className="px-4 py-1 divide-y divide-[#F3F4F6]">
                  <StatusRow
                    icon={<Wifi className="w-4 h-4 text-emerald-600" />}
                    iconWrap="bg-emerald-50"
                    title="Loja conectada"
                    description="Recebendo pedidos normalmente."
                  />

                  <StatusRow
                    icon={
                      funcionamento.tom === "ok" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )
                    }
                    iconWrap={
                      funcionamento.tom === "ok"
                        ? "bg-emerald-50"
                        : "bg-amber-50"
                    }
                    title={funcionamento.titulo}
                    description={funcionamento.descricao}
                  />

                  <StatusRow
                    icon={
                      aceitando && lojaAberta ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )
                    }
                    iconWrap={
                      aceitando && lojaAberta
                        ? "bg-emerald-50"
                        : "bg-amber-50"
                    }
                    title={
                      aceitando && lojaAberta
                        ? "Aceitando pedidos"
                        : "Pedidos pausados"
                    }
                    description={
                      aceitando && lojaAberta
                        ? "Pedidos sendo recebidos normalmente."
                        : "Nenhum pedido será recebido."
                    }
                  />

                  <StatusRow
                    icon={<Zap className="w-4 h-4 text-[#4C258C]" />}
                    iconWrap="bg-[#F3EEFA]"
                    title="Aceite automático"
                    description={autoAceite ? "Ativado" : "Desativado"}
                  />

                  <StatusRow
                    icon={<Timer className="w-4 h-4 text-orange-600" />}
                    iconWrap="bg-orange-50"
                    title="Tempo médio"
                    description={tempoMedio}
                  />
                </div>

                {/* Footer actions — só admin gerencia loja/config */}
                {(canManageStore || canOpenConfig) && (
                  <div className="p-4 pt-3 border-t border-[#F3F4F6] flex gap-2">
                    {canOpenConfig && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-10 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]",
                          canManageStore ? "flex-1" : "w-full"
                        )}
                        asChild
                      >
                        <Link
                          href="/admin/configuracoes"
                          onClick={() => setOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-1.5" />
                          Configurações
                        </Link>
                      </Button>
                    )}

                    {canManageStore && (
                      <Button
                        size="sm"
                        disabled={toggling}
                        onClick={() => void handleToggleLoja()}
                        className={cn(
                          "flex-1 h-10 rounded-xl font-semibold text-white shadow-sm",
                          lojaAberta
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        )}
                      >
                        <Store className="w-4 h-4 mr-1.5" />
                        {toggling
                          ? "Salvando..."
                          : lojaAberta
                            ? "Fechar Loja"
                            : "Abrir Loja"}
                      </Button>
                    )}
                  </div>
                )}

                {!canManageStore && !canOpenConfig && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-[11px] text-[#9CA3AF] text-center">
                      Status somente leitura. Abertura da loja é do administrador.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </div>
  );
}
