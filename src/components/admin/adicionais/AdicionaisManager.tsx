"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Opcao, GrupoOpcoes } from "@/types/adicional";
import { toast } from "sonner";
import { Loader2, Search, Plus, ChevronRight, ChevronDown, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OpcaoDetailPanel } from "./OpcaoDetailPanel";
import { NovoOpcaoDialog } from "./NovoOpcaoDialog";
import { cn } from "@/lib/utils";

interface ProdutoComGrupos {
  id: string | number;
  nome: string;
  grupos: {
    id: string | number;
    nome: string;
    opcoes: Opcao[];
  }[];
}

export function AdicionaisManager() {
  const [produtos, setProdutos] = useState<ProdutoComGrupos[]>([]);
  const [selectedOpcao, setSelectedOpcao] = useState<Opcao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ativo" | "inativo">("all");
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [expandedProdutos, setExpandedProdutos] = useState<Set<string | number>>(new Set());
  const [expandedGrupos, setExpandedGrupos] = useState<Set<string | number>>(new Set());
  const supabase = createClient();

  // Buscar estrutura completa: Produtos > Grupos > Opções
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar produtos com seus grupos
      const { data: produtoGrupos, error: pgError } = await supabase
        .from("produto_grupos")
        .select(`
          produto_id,
          grupo_id,
          produto:produtos(id, nome),
          grupo:grupos_opcoes(id, nome)
        `)
        .order("ordem", { ascending: true });

      if (pgError) throw pgError;

      // Buscar todas as opções
      let opcoesQuery = supabase
        .from("opcoes")
        .select(`
          *,
          grupo:grupos_opcoes(id, nome)
        `)
        .order("ordem", { ascending: true });

      if (statusFilter !== "all") {
        opcoesQuery = opcoesQuery.eq("status", statusFilter);
      }

      const { data: opcoes, error: opcoesError } = await opcoesQuery;
      if (opcoesError) throw opcoesError;

      // Organizar dados hierarquicamente
      const produtosMap = new Map<string | number, ProdutoComGrupos>();

      (produtoGrupos || []).forEach((pg: any) => {
        const produtoId = pg.produto_id;
        const grupoId = pg.grupo_id;
        const produto = pg.produto;
        const grupo = pg.grupo;

        if (!produto || !grupo) return;

        // Criar produto se não existir
        if (!produtosMap.has(produtoId)) {
          produtosMap.set(produtoId, {
            id: produtoId,
            nome: produto.nome,
            grupos: [],
          });
        }

        const produtoData = produtosMap.get(produtoId)!;

        // Adicionar grupo se não existir
        if (!produtoData.grupos.find(g => g.id === grupoId)) {
          produtoData.grupos.push({
            id: grupoId,
            nome: grupo.nome,
            opcoes: [],
          });
        }
      });

      // Adicionar opções aos grupos
      (opcoes || []).forEach((opcao: any) => {
        produtosMap.forEach((produto) => {
          const grupo = produto.grupos.find(g => String(g.id) === String(opcao.grupo_id));
          if (grupo) {
            grupo.opcoes.push({
              ...opcao,
              grupo: opcao.grupo,
            });
          }
        });
      });

      setProdutos(Array.from(produtosMap.values()));

      // Auto-expandir primeiro produto
      if (produtosMap.size > 0 && expandedProdutos.size === 0) {
        const primeiroProdutoId = Array.from(produtosMap.keys())[0];
        setExpandedProdutos(new Set([primeiroProdutoId]));
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar adicionais");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("opcoes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opcoes",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const toggleProduto = (produtoId: string | number) => {
    const newExpanded = new Set(expandedProdutos);
    if (newExpanded.has(produtoId)) {
      newExpanded.delete(produtoId);
    } else {
      newExpanded.add(produtoId);
    }
    setExpandedProdutos(newExpanded);
  };

  const toggleGrupo = (grupoId: string | number) => {
    const newExpanded = new Set(expandedGrupos);
    if (newExpanded.has(grupoId)) {
      newExpanded.delete(grupoId);
    } else {
      newExpanded.add(grupoId);
    }
    setExpandedGrupos(newExpanded);
  };

  // Filtrar por busca
  const filteredProdutos = produtos
    .map((produto) => ({
      ...produto,
      grupos: produto.grupos
        .map((grupo) => ({
          ...grupo,
          opcoes: grupo.opcoes.filter((opcao) =>
            opcao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grupo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((grupo) => grupo.opcoes.length > 0),
    }))
    .filter((produto) => produto.grupos.length > 0);

  const totalOpcoes = produtos.reduce(
    (total, p) => total + p.grupos.reduce((t, g) => t + g.opcoes.length, 0),
    0
  );

  const handleUpdate = (updatedOpcao: Opcao) => {
    setSelectedOpcao(updatedOpcao);
    // Atualiza a árvore local imediatamente (evita race com fetch enquanto o DB salva)
    setProdutos((prev) =>
      prev.map((produto) => ({
        ...produto,
        grupos: produto.grupos.map((grupo) => ({
          ...grupo,
          opcoes: grupo.opcoes.map((o) =>
            String(o.id) === String(updatedOpcao.id)
              ? { ...o, ...updatedOpcao }
              : o
          ),
        })),
      }))
    );
  };

  const handleDelete = (opcaoId: string | number) => {
    setSelectedOpcao(null);
    setProdutos((prev) =>
      prev.map((produto) => ({
        ...produto,
        grupos: produto.grupos.map((grupo) => ({
          ...grupo,
          opcoes: grupo.opcoes.filter((o) => String(o.id) !== String(opcaoId)),
        })),
      }))
    );
  };

  const handleCreate = (novaOpcao: Opcao) => {
    fetchData();
    setSelectedOpcao(novaOpcao);
    setShowNovoDialog(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FC]">
        <Loader2 className="w-8 h-8 text-[#4C258C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FC] flex">
      {/* Lista Hierárquica - Esquerda */}
      <div className="w-[380px] flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Adicionais</h2>
              <p className="text-sm text-[#6B7280]">
                {totalOpcoes} {totalOpcoes === 1 ? "adicional" : "adicionais"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowNovoDialog(true)}
              className="bg-[#4C258C] hover:bg-[#5E35B1]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>

          {/* Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <Input
              placeholder="Buscar adicionais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-[#4C258C] hover:bg-[#5E35B1]" : ""}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "ativo" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ativo")}
              className={statusFilter === "ativo" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Ativos
            </Button>
            <Button
              variant={statusFilter === "inativo" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inativo")}
              className={statusFilter === "inativo" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Inativos
            </Button>
          </div>

          {/* Expandir/Recolher Tudo */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const todosProdutosIds = produtos.map(p => p.id);
                const todosGruposIds = produtos.flatMap(p => p.grupos.map(g => g.id));
                setExpandedProdutos(new Set(todosProdutosIds));
                setExpandedGrupos(new Set(todosGruposIds));
              }}
              className="flex-1 text-xs"
            >
              Expandir Tudo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setExpandedProdutos(new Set());
                setExpandedGrupos(new Set());
              }}
              className="flex-1 text-xs"
            >
              Recolher Tudo
            </Button>
          </div>
        </div>

        {/* Lista Hierárquica */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredProdutos.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Package className="w-12 h-12 text-[#9CA3AF] mb-3" />
                <p className="text-sm text-[#6B7280]">Nenhum adicional encontrado</p>
              </div>
            ) : (
              filteredProdutos.map((produto) => (
                <div key={produto.id} className="mb-2">
                  {/* Produto */}
                  <button
                    onClick={() => toggleProduto(produto.id)}
                    className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-[#F8F9FC] transition-colors"
                  >
                    {expandedProdutos.has(produto.id) ? (
                      <ChevronDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                    )}
                    <Package className="w-4 h-4 text-[#4C258C] flex-shrink-0" />
                    <span className="text-sm font-semibold text-[#111827] truncate">
                      {produto.nome}
                    </span>
                    <span className="ml-auto text-xs text-[#6B7280] bg-[#F8F9FC] px-2 py-0.5 rounded-full">
                      {produto.grupos.reduce((t, g) => t + g.opcoes.length, 0)}
                    </span>
                  </button>

                  {/* Grupos (quando produto expandido) */}
                  {expandedProdutos.has(produto.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {produto.grupos.map((grupo) => (
                        <div key={grupo.id}>
                          {/* Grupo */}
                          <button
                            onClick={() => toggleGrupo(grupo.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#F8F9FC] transition-colors"
                          >
                            {expandedGrupos.has(grupo.id) ? (
                              <ChevronDown className="w-3 h-3 text-[#6B7280] flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-[#6B7280] flex-shrink-0" />
                            )}
                            <span className="text-xs font-medium text-[#6B7280] truncate">
                              {grupo.nome}
                            </span>
                            <span className="ml-auto text-[10px] text-[#9CA3AF] bg-[#F8F9FC] px-1.5 py-0.5 rounded">
                              {grupo.opcoes.length}
                            </span>
                          </button>

                          {/* Opções (quando grupo expandido) */}
                          {expandedGrupos.has(grupo.id) && (
                            <div className="ml-5 mt-1 space-y-1">
                              {grupo.opcoes.map((opcao) => {
                                const isSelected = selectedOpcao?.id === opcao.id;
                                const isAtivo = opcao.status === "ativo";

                                return (
                                  <button
                                    key={opcao.id}
                                    onClick={() => setSelectedOpcao(opcao)}
                                    className={cn(
                                      "w-full p-2 rounded-lg text-left transition-all duration-200 relative",
                                      isSelected
                                        ? "bg-[#EEE8FA] shadow-sm"
                                        : "hover:bg-[#F8F9FC]"
                                    )}
                                  >
                                    {isSelected && (
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4C258C] rounded-l-lg" />
                                    )}
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={cn(
                                          "text-xs font-medium truncate",
                                          isSelected ? "text-[#4C258C]" : "text-[#111827]"
                                        )}
                                      >
                                        {opcao.nome}
                                      </span>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-[10px] font-semibold text-[#111827]">
                                          +R$ {opcao.preco_adicional.toFixed(2)}
                                        </span>
                                        <span
                                          className={cn(
                                            "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                                            opcao.esta_disponivel
                                              ? "bg-emerald-50 text-emerald-700"
                                              : "bg-red-50 text-red-700"
                                          )}
                                        >
                                          {opcao.esta_disponivel ? "Disp" : "Esg"}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Painel de Detalhes */}
      {selectedOpcao ? (
        <OpcaoDetailPanel
          opcao={selectedOpcao}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
            <p className="text-[#6B7280] mb-2">Selecione um adicional para ver os detalhes</p>
            <p className="text-sm text-[#9CA3AF]">
              Navegue pela estrutura Produto → Grupo → Adicional
            </p>
          </div>
        </div>
      )}

      {/* Dialog Novo Adicional */}
      <NovoOpcaoDialog
        open={showNovoDialog}
        onOpenChange={setShowNovoDialog}
        onCreate={handleCreate}
      />
    </div>
  );
}
