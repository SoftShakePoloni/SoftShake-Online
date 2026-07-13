"use client";

import { RefreshCw, Volume2, VolumeX, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  KANBAN_COLUMNS,
  type PedidosFilters,
} from "./kanban-columns";

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
  totalCount,
}: PedidosToolbarProps) {
  return (
    <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-3 sm:px-4 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[15px] font-semibold text-[#111827]">Pedidos</h2>
          <span className="text-[13px] text-[#6B7280] tabular-nums">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            Aceite auto
            <Switch
              checked={autoAccept}
              disabled={autoAcceptLoading}
              onCheckedChange={onAutoAcceptChange}
              className="h-5 w-9 data-[state=checked]:bg-[#4C258C] data-[state=unchecked]:bg-[#D1D5DB] [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
            />
          </label>
          <button
            type="button"
            onClick={() => onSoundChange(!soundEnabled)}
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center border border-[#E5E7EB]",
              soundEnabled
                ? "text-[#111827] bg-white"
                : "text-[#9CA3AF] bg-[#F9FAFB]"
            )}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
            aria-label="Som de novos pedidos"
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

      {/* Busca + filtros em uma linha */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar pedido, cliente, telefone, produto…"
            className="w-full h-9 pl-8 pr-3 rounded-md border border-[#E5E7EB] bg-white text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#4C258C]/40 focus:border-[#4C258C]"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              status: v as PedidosFilters["status"],
            })
          }
        >
          <SelectTrigger className="h-9 w-[130px] rounded-md border-[#E5E7EB] text-[13px]">
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
          onValueChange={(v) =>
            onFiltersChange({ ...filters, pagamento: v })
          }
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
          value={filters.tipo}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              tipo: v as PedidosFilters["tipo"],
            })
          }
        >
          <SelectTrigger className="h-9 w-[120px] rounded-md border-[#E5E7EB] text-[13px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-[13px]">
              Tipo
            </SelectItem>
            <SelectItem value="delivery" className="text-[13px]">
              Entrega
            </SelectItem>
            <SelectItem value="retirada" className="text-[13px]">
              Retirada
            </SelectItem>
            <SelectItem value="mesa" className="text-[13px]">
              Mesa
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
    </div>
  );
}
