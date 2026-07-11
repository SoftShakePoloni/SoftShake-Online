"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  createProduto,
  updateProduto,
  deleteProduto,
  duplicateProduto,
  reorderProdutos,
} from "@/actions/admin/produtos";
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
  duplicateCategoria,
  reorderCategorias,
} from "@/actions/admin/categorias";
import { setProdutoGrupos } from "@/actions/admin/grupos-opcoes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CatalogoHeader } from "./CatalogoHeader";
import { CatalogoTabs } from "./CatalogoTabs";
import { CategoriasSidebar } from "./CategoriasSidebar";
import { ProdutosArea } from "./ProdutosArea";
import { ProdutoDrawer, type ProdutoFormValues } from "./ProdutoDrawer";
import { ComplementosTab } from "./ComplementosTab";
import { ComingSoonTab } from "./ComingSoonTab";
import type {
  CatalogTab,
  CatalogProduto,
  CatalogCategoria,
} from "./types";

interface CatalogoManagerProps {
  produtosIniciais: CatalogProduto[];
  categoriasIniciais: CatalogCategoria[];
}

export function CatalogoManager({
  produtosIniciais,
  categoriasIniciais,
}: CatalogoManagerProps) {
  const [tab, setTab] = useState<CatalogTab>("produtos");
  const [produtos, setProdutos] =
    useState<CatalogProduto[]>(produtosIniciais);
  const [categorias, setCategorias] =
    useState<CatalogCategoria[]>(categoriasIniciais);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerProduto, setDrawerProduto] = useState<CatalogProduto | null>(
    null
  );
  const [drawerReadOnly, setDrawerReadOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogProduto | null>(
    null
  );

  const supabase = createClient();

  // Realtime produtos + categorias
  useEffect(() => {
    const channel = supabase
      .channel("catalogo-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "produtos" },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: number };
            if (old?.id != null) {
              setProdutos((prev) =>
                prev.filter((p) => String(p.id) !== String(old.id))
              );
            }
            return;
          }

          const row = payload.new as { id?: number };
          if (row?.id == null) return;

          const { data } = await supabase
            .from("produtos")
            .select(
              `*, categoria:categorias(id, nome), tag:tags(id, nome, cor_fundo, cor_texto)`
            )
            .eq("id", row.id)
            .maybeSingle();

          if (!data) return;
          const full = data as CatalogProduto;

          setProdutos((prev) => {
            const idx = prev.findIndex((p) => String(p.id) === String(full.id));
            if (idx === -1) return [full, ...prev];
            const copy = prev.slice();
            copy[idx] = full;
            return copy;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categorias" },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: number };
            if (old?.id != null) {
              setCategorias((prev) =>
                prev.filter((c) => String(c.id) !== String(old.id))
              );
              setSelectedCategoriaId((cur) =>
                cur === String(old.id) ? null : cur
              );
            }
            return;
          }
          const row = payload.new as CatalogCategoria;
          if (!row?.id) return;
          setCategorias((prev) => {
            const idx = prev.findIndex((c) => String(c.id) === String(row.id));
            if (idx === -1) {
              return [...prev, row].sort(
                (a, b) => Number(a.ordem || 0) - Number(b.ordem || 0)
              );
            }
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], ...row };
            return copy.sort(
              (a, b) => Number(a.ordem || 0) - Number(b.ordem || 0)
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const openNovo = useCallback(() => {
    setDrawerProduto(null);
    setDrawerReadOnly(false);
    setDrawerOpen(true);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openNovo();
      }
      if (e.key === "/") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>(
          'input[aria-label="Buscar produtos"]'
        );
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openNovo]);

  const openEdit = (p: CatalogProduto) => {
    setDrawerProduto(p);
    setDrawerReadOnly(false);
    setDrawerOpen(true);
  };

  const openView = (p: CatalogProduto) => {
    setDrawerProduto(p);
    setDrawerReadOnly(true);
    setDrawerOpen(true);
  };

  const handleSave = async (values: ProdutoFormValues) => {
    try {
      let produtoId: string | number;

      if (drawerProduto?.id != null) {
        const promoRaw = values.preco_promocional;
        const precoPromocional =
          promoRaw === "" || promoRaw == null
            ? null
            : Number(promoRaw) > 0
              ? Number(promoRaw)
              : null;

        const updated = await updateProduto(drawerProduto.id, {
          nome: values.nome,
          descricao: values.descricao || null,
          preco_base: values.preco_base,
          preco_promocional: precoPromocional,
          categoria_id: values.categoria_id || null,
          esta_disponivel: values.esta_disponivel,
          imagem_url: values.imagem_url || null,
          tag_id: values.tagId,
        });
        produtoId = updated.id ?? drawerProduto.id;
        toast.success("Produto atualizado");
      } else {
        const promoRaw = values.preco_promocional;
        const precoPromocional =
          promoRaw === "" || promoRaw == null
            ? null
            : Number(promoRaw) > 0
              ? Number(promoRaw)
              : null;

        const created = await createProduto({
          nome: values.nome,
          descricao: values.descricao || null,
          preco_base: values.preco_base,
          preco_promocional: precoPromocional,
          categoria_id: values.categoria_id || null,
          esta_disponivel: values.esta_disponivel,
          imagem_url: values.imagem_url || null,
          tag_id: values.tagId,
        });
        produtoId = created.id;
        toast.success("Produto criado");
      }

      // Só sincroniza produto_grupos quando a lista foi hidratada no drawer.
      // syncGrupos === false evita apagar complementos ao salvar só tag/preço.
      if (values.syncGrupos !== false) {
        try {
          await setProdutoGrupos(produtoId, values.grupoIds || []);
        } catch (linkErr) {
          console.error(linkErr);
          toast.error("Produto salvo, mas falhou ao vincular complementos", {
            description:
              linkErr instanceof Error
                ? linkErr.message
                : "Tente editar de novo",
          });
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar produto");
      throw e;
    }
  };

  const handleDuplicate = async (p: CatalogProduto) => {
    try {
      await duplicateProduto(p.id);
      toast.success("Produto duplicado (inativo)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao duplicar");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduto(deleteTarget.id);
      toast.success("Produto excluído");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  const handleToggle = async (p: CatalogProduto) => {
    // null/undefined no banco = ativo. Só false é inativo.
    const currentlyOn = p.esta_disponivel !== false;
    const next = !currentlyOn;

    // Otimista — UI responde na hora
    setProdutos((prev) =>
      prev.map((item) =>
        String(item.id) === String(p.id)
          ? { ...item, esta_disponivel: next }
          : item
      )
    );

    try {
      const updated = await updateProduto(p.id, {
        esta_disponivel: next,
      });
      setProdutos((prev) =>
        prev.map((item) =>
          String(item.id) === String(p.id)
            ? ({ ...item, ...updated } as CatalogProduto)
            : item
        )
      );
      toast.success(next ? "Produto ativado" : "Produto desativado");
    } catch (e) {
      // rollback
      setProdutos((prev) =>
        prev.map((item) =>
          String(item.id) === String(p.id)
            ? { ...item, esta_disponivel: p.esta_disponivel }
            : item
        )
      );
      toast.error(
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar disponibilidade"
      );
    }
  };

  const handleReorderProdutos = async (orderedIds: string[]) => {
    // optimistic
    setProdutos((prev) => {
      const map = new Map(prev.map((p) => [String(p.id), p]));
      const reordered = orderedIds
        .map((id, i) => {
          const p = map.get(id);
          if (!p) return null;
          return { ...p, ordem: i + 1 };
        })
        .filter(Boolean) as CatalogProduto[];
      const rest = prev.filter((p) => !orderedIds.includes(String(p.id)));
      return [...reordered, ...rest];
    });
    try {
      await reorderProdutos(orderedIds);
    } catch {
      toast.error("Falha ao reordenar produtos");
    }
  };

  const handleReorderCategorias = async (orderedIds: string[]) => {
    setCategorias((prev) => {
      const map = new Map(prev.map((c) => [String(c.id), c]));
      return orderedIds
        .map((id, i) => {
          const c = map.get(id);
          if (!c) return null;
          return { ...c, ordem: i + 1 };
        })
        .filter(Boolean) as CatalogCategoria[];
    });
    try {
      await reorderCategorias(orderedIds);
    } catch {
      toast.error("Falha ao reordenar categorias");
    }
  };

  const exportCatalog = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      categorias,
      produtos,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `softshake-catalogo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Catálogo exportado");
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#F7F8FC] overflow-hidden">
      <CatalogoHeader
        search={search}
        onSearchChange={setSearch}
        onNovoProduto={openNovo}
        onImport={() =>
          toast.message("Importação em breve", {
            description: "Em breve você poderá importar planilhas CSV/JSON.",
          })
        }
        onExport={exportCatalog}
      />

      <CatalogoTabs active={tab} onChange={setTab} />

      {tab === "produtos" && (
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <div className="hidden md:flex h-full">
            <CategoriasSidebar
              categorias={categorias}
              produtos={produtos}
              selectedId={selectedCategoriaId}
              onSelect={setSelectedCategoriaId}
              onReorder={(ids) => void handleReorderCategorias(ids)}
              onCreate={async (nome) => {
                await createCategoria({ nome });
                toast.success("Categoria criada");
              }}
              onUpdate={async (id, nome) => {
                await updateCategoria(id, { nome });
                toast.success("Categoria atualizada");
              }}
              onDuplicate={async (id) => {
                await duplicateCategoria(id);
                toast.success("Categoria duplicada");
              }}
              onDelete={async (id) => {
                await deleteCategoria(id);
                toast.success("Categoria excluída");
              }}
            />
          </div>

          {/* Mobile categorias strip */}
          <div className="md:hidden shrink-0 bg-white border-b border-[#E5E7EB] overflow-x-auto">
            <div className="flex gap-1 px-3 py-2">
              <Chip
                active={selectedCategoriaId == null}
                onClick={() => setSelectedCategoriaId(null)}
                label="Todas"
              />
              {categorias.map((c) => (
                <Chip
                  key={c.id}
                  active={selectedCategoriaId === String(c.id)}
                  onClick={() => setSelectedCategoriaId(String(c.id))}
                  label={c.nome}
                />
              ))}
            </div>
          </div>

          {/* Busca mobile */}
          <div className="md:hidden shrink-0 px-3 py-2 bg-white border-b border-[#E5E7EB]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos…"
              aria-label="Buscar produtos"
              className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-[#F7F8FC] text-sm outline-none focus:ring-2 focus:ring-[#4C258C]/25"
            />
          </div>

          <ProdutosArea
            categorias={categorias}
            produtos={produtos}
            selectedCategoriaId={selectedCategoriaId}
            search={search}
            onReorder={(ids) => void handleReorderProdutos(ids)}
            onEdit={openEdit}
            onDuplicate={(p) => void handleDuplicate(p)}
            onView={openView}
            onDelete={setDeleteTarget}
            onToggleDisponivel={(p) => void handleToggle(p)}
            onNovoProduto={openNovo}
          />
        </div>
      )}

      {tab === "complementos" && <ComplementosTab mode="complementos" />}
      {tab === "opcoes" && <ComplementosTab mode="opcoes" />}
      {tab === "combos" && (
        <ComingSoonTab
          title="Combos"
          description="Monte combos com múltiplos produtos e preço especial. Em desenvolvimento."
        />
      )}
      {tab === "promocoes" && (
        <ComingSoonTab
          title="Promoções"
          description="Campanhas, descontos e vitrines promocionais do cardápio. Em desenvolvimento."
        />
      )}

      <ProdutoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        produto={drawerProduto}
        categorias={categorias}
        defaultCategoriaId={selectedCategoriaId}
        onSave={handleSave}
        readOnly={drawerReadOnly}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.nome}” será removido do catálogo. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3EEFA] text-[#4C258C] border border-[#D4C4F0]"
          : "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F7F8FC] text-[#6B7280] border border-[#E5E7EB]"
      }
    >
      {label}
    </button>
  );
}
