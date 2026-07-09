"use client";

import { useState, useEffect } from "react";
import { Produto, Categoria } from "@/types/produto";
import { ProdutoList } from "./ProdutoList";
import { ProdutoDetailPanel } from "./ProdutoDetailPanel";
import { ProdutoSidePanel } from "./ProdutoSidePanel";
import { EmptyState } from "./EmptyState";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ProdutosManagerProps {
  produtosIniciais: Produto[];
  categoriasIniciais: Categoria[];
}

export function ProdutosManager({
  produtosIniciais,
  categoriasIniciais,
}: ProdutosManagerProps) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const supabase = createClient();

  // Setup Realtime
  useEffect(() => {
    const channel = supabase
      .channel("produtos-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "produtos",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const novoProduto = payload.new as Produto;
            // Buscar dados completos com relações
            const { data } = await supabase
              .from("produtos")
              .select(
                `
                *,
                categoria:categorias(id, nome),
                tag:tags(id, nome)
              `
              )
              .eq("id", novoProduto.id)
              .single();

            if (data) {
              setProdutos((prev) => [data as Produto, ...prev]);
              toast.success("Novo produto adicionado");
            }
          } else if (payload.eventType === "UPDATE") {
            const produtoAtualizado = payload.new as Produto;
            // Buscar dados completos com relações
            const { data } = await supabase
              .from("produtos")
              .select(
                `
                *,
                categoria:categorias(id, nome),
                tag:tags(id, nome)
              `
              )
              .eq("id", produtoAtualizado.id)
              .single();

            if (data) {
              setProdutos((prev) =>
                prev.map((p) => (String(p.id) === String(data.id) ? (data as Produto) : p))
              );
              // Atualizar produto selecionado se for o mesmo
              if (selectedProduto && String(selectedProduto.id) === String(data.id)) {
                setSelectedProduto(data as Produto);
              }
              // Toast removido - já é mostrado no ProdutoDetailPanel
            }
          } else if (payload.eventType === "DELETE") {
            const produtoRemovido = payload.old as Produto;
            setProdutos((prev) => prev.filter((p) => String(p.id) !== String(produtoRemovido.id)));
            // Limpar seleção se for o produto removido
            if (selectedProduto && String(selectedProduto.id) === String(produtoRemovido.id)) {
              setSelectedProduto(null);
            }
            toast.success("Produto removido");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedProduto]);

  const handleSelect = (produto: Produto) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedProduto(produto);
      setIsTransitioning(false);
    }, 150);
  };

  const handleUpdate = async (produtoAtualizado: Produto) => {
    // Atualizar apenas o estado local
    // O Realtime já vai atualizar a lista
    setProdutos((prev) =>
      prev.map((p) => (String(p.id) === String(produtoAtualizado.id) ? produtoAtualizado : p))
    );
    setSelectedProduto(produtoAtualizado);
  };

  const handleDelete = async (produtoId: string | number) => {
    setProdutos((prev) => prev.filter((p) => String(p.id) !== String(produtoId)));
    setSelectedProduto(null);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#F8F9FC]">
      {/* Lista de Produtos - Esquerda */}
      <ProdutoList
        produtos={produtos}
        categorias={categorias}
        selectedId={selectedProduto?.id}
        onSelect={handleSelect}
      />

      {/* Painel de Detalhes - Centro com Animação */}
      <div
        className={`flex-1 transition-opacity duration-200 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {selectedProduto ? (
          <ProdutoDetailPanel
            produto={selectedProduto}
            categorias={categorias}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Painel Lateral - Direita com Animação */}
      {selectedProduto && (
        <div
          className={`transition-all duration-200 ${
            isTransitioning
              ? "opacity-0 translate-x-4"
              : "opacity-100 translate-x-0"
          }`}
        >
          <ProdutoSidePanel produto={selectedProduto} />
        </div>
      )}
    </div>
  );
}
