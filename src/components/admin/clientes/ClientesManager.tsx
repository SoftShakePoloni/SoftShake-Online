"use client";

import { useState, useEffect } from "react";
import { Cliente } from "@/types/cliente";
import { ClienteList } from "./ClienteList";
import { ClienteDetailPanel } from "./ClienteDetailPanel";
import { ClienteSidePanel } from "./ClienteSidePanel";
import { EmptyState } from "./EmptyState";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ClientesManagerProps {
  clientesIniciais: Cliente[];
}

export function ClientesManager({ clientesIniciais }: ClientesManagerProps) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const supabase = createClient();

  // Setup Realtime
  useEffect(() => {
    const channel = supabase
      .channel("clientes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clientes",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const novoCliente = payload.new as Cliente;
            setClientes((prev) => [novoCliente, ...prev]);
            toast.success("Novo cliente cadastrado");
          } else if (payload.eventType === "UPDATE") {
            const clienteAtualizado = payload.new as Cliente;
            setClientes((prev) =>
              prev.map((c) => (c.id === clienteAtualizado.id ? clienteAtualizado : c))
            );
            if (selectedCliente?.id === clienteAtualizado.id) {
              setSelectedCliente(clienteAtualizado);
            }
            toast.success("Cliente atualizado");
          } else if (payload.eventType === "DELETE") {
            const clienteRemovido = payload.old as Cliente;
            setClientes((prev) => prev.filter((c) => c.id !== clienteRemovido.id));
            if (selectedCliente?.id === clienteRemovido.id) {
              setSelectedCliente(null);
            }
            toast.success("Cliente removido");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedCliente]);

  const handleSelect = (cliente: Cliente) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedCliente(cliente);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#F8F9FC]">
      {/* Lista de Clientes - Esquerda */}
      <ClienteList
        clientes={clientes}
        selectedId={selectedCliente?.id}
        onSelect={handleSelect}
      />

      {/* Painel de Detalhes - Centro com Animação */}
      <div
        className={`flex-1 transition-opacity duration-200 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {selectedCliente ? (
          <ClienteDetailPanel cliente={selectedCliente} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Painel Lateral - Direita com Animação */}
      {selectedCliente && (
        <div
          className={`transition-all duration-200 ${
            isTransitioning
              ? "opacity-0 translate-x-4"
              : "opacity-100 translate-x-0"
          }`}
        >
          <ClienteSidePanel cliente={selectedCliente} />
        </div>
      )}
    </div>
  );
}
