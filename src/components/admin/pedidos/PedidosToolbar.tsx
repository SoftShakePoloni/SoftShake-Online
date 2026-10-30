"use client";
import { useEffect, useState } from "react";

import {
  SlidersHorizontal,
  RefreshCw,
  Volume2,
  VolumeX,
  Search,
  Truck,
  Utensils,
  ShoppingBag,
  LayoutGrid,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KANBAN_COLUMNS, type PedidosFilters } from "./kanban-columns";

interface PedidosToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters: PedidosFilters;
  onFiltersChange: (f: PedidosFilters) => void;
  onRefresh: () => void;
  refreshing?: boolean;
  soundEnabled: boolean;
  onSoundChange: (v: boolean) => void;
  autoAccept: boolean;
  autoAcceptLoading?: boolean;
  onAutoAcceptChange: (v: boolean) => void;
  /** Só admin pode alterar aceite automático */
  canManageStore?: boolean;
  totalCount: number;
}

export function PedidosToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onRefresh,
  refreshing,
  soundEnabled,
  onSoundChange,
  autoAccept,
  autoAcceptLoading,
  onAutoAcceptChange,
  canManageStore = false,
  totalCount,
}: PedidosToolbarProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const sync = () => setOptionsOpen(desktop.matches);
    sync(); desktop.addEventListener("change", sync);
    return () => desktop.removeEventListener("change", sync);
  }, []);
  const typeTabs = [
    { value: "todos", label: "Todos", Icon: LayoutGrid },
    { value: "delivery", label: "Delivery", Icon: Truck },
    { value: "mesa", label: "Mesas", Icon: Utensils },
    { value: "retirada", label: "Retirada", Icon: ShoppingBag },
  ] as const;

  return (
    <div className="shrink-0 border-b border-[#E7E1EB] bg-white px-3 sm:px-5 py-3 space-y-3">
        <div className="relative min-w-0 w-full flex-auto sm:min-w-[180px] sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8292]" />
          <input
            type="search"
            aria-label="Buscar cliente ou número do pedido"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar pedido ou cliente…"
            className="h-9 w-full rounded-lg border border-[#E7E1EB] bg-[#F8F7F9] pl-9 pr-3 text-[13px] text-[#241631] placeholder:text-[#9A929F] focus:border-[#432078] focus:outline-none focus:ring-2 focus:ring-[#432078]/10"
          />
        </div>
      <details open={optionsOpen} onToggle={event => setOptionsOpen(event.currentTarget.open)} className="orders-options md:contents"><summary className="orders-options-summary md:hidden"><SlidersHorizontal size={16} aria-hidden="true"/>Filtros e opções{(filters.tipo!=="todos"||filters.pagamento!=="todos"||filters.periodo!=="hoje")&&<span className="text-[#4C258C]"> • ativos</span>}</summary>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex max-w-full flex-wrap rounded-lg border border-[#E2DCE7] bg-[#F4F1F7] p-0.5">
          {typeTabs.map(({ value, label, Icon }) => {
            const active = filters.tipo === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onFiltersChange({ ...filters, tipo: value })}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors sm:px-3",
                  active
                    ? "bg-[#432078] text-white shadow-sm"
                    : "text-[#63586B] hover:bg-white hover:text-[#432078]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
        <span className="hidden shrink-0 text-xs text-[#817A89] sm:inline">
          {totalCount} {totalCount === 1 ? "pedido" : "pedidos"}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {canManageStore && (
            <label className="flex min-h-11 items-center gap-1.5 text-[12px] text-[#6B7280]">
              Aceite auto
              <Switch
                checked={autoAccept}
                disabled={autoAcceptLoading}
                onCheckedChange={onAutoAcceptChange}
                className="h-5 w-9 data-[state=checked]:bg-[#432078] data-[state=unchecked]:bg-[#D1D5DB] [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
              />
            </label>
          )}
          <button
            type="button"
            onClick={() => onSoundChange(!soundEnabled)}
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center border border-[#E5E7EB]",
              soundEnabled
                ? "text-[#111827] bg-white"
                : "text-[#9CA3AF] bg-[#F9FAFB]",
            )}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
            aria-label="Som de novos pedidos"
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Atualizar pedidos"
            disabled={refreshing}
            className="h-8 px-2.5 rounded-md border border-[#E5E7EB] text-[13px] font-medium text-[#111827] bg-white hover:bg-[#F9FAFB] disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", refreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros adicionais */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.status}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              status: v as PedidosFilters["status"],
            })
          }
        >
          <SelectTrigger className="hidden md:flex h-9 w-[130px] rounded-md border-[#E5E7EB] text-[13px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-[13px]">
              Todos status
            </SelectItem>
            {KANBAN_COLUMNS.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-[13px]">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.pagamento}
          onValueChange={(v) => onFiltersChange({ ...filters, pagamento: v })}
        >
          <SelectTrigger className="h-9 w-[120px] rounded-md border-[#E5E7EB] text-[13px]">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-[13px]">
              Pagamento
            </SelectItem>
            <SelectItem value="pix" className="text-[13px]">
              PIX
            </SelectItem>
            <SelectItem value="cartão" className="text-[13px]">
              Cartão
            </SelectItem>
            <SelectItem value="dinheiro" className="text-[13px]">
              Dinheiro
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.periodo}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              periodo: v as PedidosFilters["periodo"],
            })
          }
        >
          <SelectTrigger className="h-9 w-[110px] rounded-md border-[#E5E7EB] text-[13px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje" className="text-[13px]">
              Hoje
            </SelectItem>
            <SelectItem value="24h" className="text-[13px]">
              24 horas
            </SelectItem>
            <SelectItem value="7d" className="text-[13px]">
              7 dias
            </SelectItem>
            <SelectItem value="todos" className="text-[13px]">
              Todos
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      </details>
    </div>
  );
}
