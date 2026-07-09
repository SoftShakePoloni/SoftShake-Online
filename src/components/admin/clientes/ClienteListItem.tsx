"use client";

import { Cliente, clienteStatusConfig } from "@/types/cliente";
import { cn } from "@/lib/utils";
import { Phone, MapPin, ShoppingBag, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClienteListItemProps {
  cliente: Cliente;
  isSelected: boolean;
  onClick: () => void;
}

export function ClienteListItem({
  cliente,
  isSelected,
  onClick,
}: ClienteListItemProps) {
  const statusInfo = cliente.status_cliente
    ? clienteStatusConfig[cliente.status_cliente]
    : null;

  const iniciais = cliente.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const enderecoPrincipal = cliente.enderecos_adicionais?.find((e) => e.principal);
  const cidade = enderecoPrincipal?.cidade || "Não informado";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group",
        isSelected
          ? "bg-[#EEE8FA] border-[#4C258C] shadow-sm"
          : "bg-white border-[#E5E7EB] hover:border-[#4C258C] hover:shadow-sm"
      )}
    >
      {/* Barra lateral roxa quando selecionado */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4C258C]" />
      )}

      <div className={cn("flex gap-3", isSelected && "pl-2")}>
        {/* Avatar */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm",
            isSelected
              ? "bg-[#4C258C] text-white"
              : "bg-gradient-to-br from-[#4C258C] to-[#7C3AED] text-white"
          )}
        >
          {iniciais}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={cn(
                "font-semibold text-sm truncate",
                isSelected ? "text-[#4C258C]" : "text-[#111827]"
              )}
            >
              {cliente.nome}
            </h3>
            {statusInfo && (
              <Badge
                variant="outline"
                className={cn("text-xs px-1.5 py-0 h-5", statusInfo.color)}
              >
                {statusInfo.label}
              </Badge>
            )}
          </div>

          {/* Telefone */}
          {cliente.telefone && (
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-1">
              <Phone className="w-3 h-3" />
              <span className="truncate">{cliente.telefone}</span>
            </div>
          )}

          {/* Cidade */}
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{cidade}</span>
          </div>

          {/* Estatísticas */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 text-[#6B7280]">
              <ShoppingBag className="w-3 h-3" />
              <span>{cliente.total_pedidos || 0} pedidos</span>
            </div>
            <div className="flex items-center gap-1 text-[#4C258C] font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>R$ {(cliente.total_gasto || 0).toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          {/* Último pedido */}
          {cliente.ultimo_pedido && (
            <p className="text-xs text-[#6B7280] mt-1">
              Último pedido{" "}
              {formatDistanceToNow(new Date(cliente.ultimo_pedido), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
