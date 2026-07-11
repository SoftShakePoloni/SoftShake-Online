"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Tag, Trash2, Check } from "lucide-react";
import {
  listTags,
  createTag,
  deleteTag,
  type TagRow,
} from "@/actions/admin/tags";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Atalhos alinhados às tags já usadas na SoftShake (tabela `tags`). */
const PRESETS: { nome: string; cor_fundo: string; cor_texto: string }[] = [
  { nome: "Mais Pedido", cor_fundo: "#EF4444", cor_texto: "#FFFFFF" },
  { nome: "Premium", cor_fundo: "#F59E0B", cor_texto: "#000000" },
  { nome: "Novidade", cor_fundo: "#7F00FF", cor_texto: "#000000" },
  { nome: "Promoção", cor_fundo: "#FFEDD5", cor_texto: "#C2410C" },
  { nome: "Recomendado", cor_fundo: "#F3EEFA", cor_texto: "#4C258C" },
];

const COLOR_SWATCHES = [
  { cor_fundo: "#EF4444", cor_texto: "#FFFFFF" },
  { cor_fundo: "#F59E0B", cor_texto: "#000000" },
  { cor_fundo: "#7F00FF", cor_texto: "#000000" },
  { cor_fundo: "#F3EEFA", cor_texto: "#4C258C" },
  { cor_fundo: "#FEF3C7", cor_texto: "#B45309" },
  { cor_fundo: "#DBEAFE", cor_texto: "#1D4ED8" },
  { cor_fundo: "#D1FAE5", cor_texto: "#047857" },
  { cor_fundo: "#F3F4F6", cor_texto: "#374151" },
];

/**
 * Seleção de tag do produto (FK `produtos.tag_id`) + criação de novas tags.
 * O schema atual permite **uma** tag por produto.
 */
export function ProdutoTagsPanel({
  selectedTagId,
  onChange,
  readOnly = false,
}: {
  selectedTagId: string | null;
  onChange: (tagId: string | null) => void;
  readOnly?: boolean;
}) {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newFundo, setNewFundo] = useState("#F3EEFA");
  const [newTexto, setNewTexto] = useState("#4C258C");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTags();
      setTags(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectTag = (id: string) => {
    if (readOnly) return;
    if (selectedTagId === id) {
      onChange(null);
    } else {
      onChange(id);
    }
  };

  const handleCreate = async () => {
    if (!newNome.trim() || readOnly) return;
    setBusy(true);
    try {
      const tag = await createTag({
        nome: newNome.trim(),
        cor_fundo: newFundo,
        cor_texto: newTexto,
      });
      setTags((prev) => {
        if (prev.some((t) => t.id === tag.id)) return prev;
        return [...prev, tag].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR")
        );
      });
      onChange(String(tag.id));
      setNewNome("");
      setCreating(false);
      toast.success("Tag criada e selecionada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar tag");
    } finally {
      setBusy(false);
    }
  };

  const handlePreset = async (preset: (typeof PRESETS)[0]) => {
    if (readOnly) return;
    setBusy(true);
    try {
      const tag = await createTag(preset);
      setTags((prev) => {
        if (prev.some((t) => t.id === tag.id)) return prev;
        return [...prev, tag].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR")
        );
      });
      onChange(String(tag.id));
      toast.success(`Tag “${tag.nome}” pronta`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar tag");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (tag: TagRow) => {
    if (readOnly) return;
    if (
      !confirm(
        `Excluir a tag “${tag.nome}”? Produtos com ela ficarão sem tag.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      if (selectedTagId === String(tag.id)) onChange(null);
      toast.success("Tag excluída");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-[#9CA3AF] text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando tags…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[#111827]">Tag do produto</p>
        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
          Destaque no cardápio (ex.: Mais vendido, Novidade, Promoção). Clique
          de novo na tag selecionada para remover.
        </p>
      </div>

      {selectedTagId && (
        <p className="text-[11px] font-medium text-[#4C258C] bg-[#F3EEFA] rounded-lg px-3 py-2">
          1 tag selecionada — aparece no cardápio e na lista do admin
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onChange(null)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            selectedTagId == null
              ? "border-[#4C258C] bg-[#F3EEFA] text-[#4C258C] ring-2 ring-[#4C258C]/20"
              : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D4C4F0]"
          )}
        >
          Sem tag
        </button>

        {tags.map((tag) => {
          const selected = selectedTagId === String(tag.id);
          return (
            <div key={tag.id} className="relative group/tag">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => selectTag(String(tag.id))}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all",
                  selected
                    ? "ring-2 ring-[#4C258C]/35 border-transparent scale-[1.02]"
                    : "border-transparent hover:opacity-90"
                )}
                style={{
                  backgroundColor: tag.cor_fundo,
                  color: tag.cor_texto || "#111827",
                }}
              >
                {selected && <Check className="w-3 h-3" />}
                {tag.nome}
              </button>
              {!readOnly && (
                <button
                  type="button"
                  title="Excluir tag"
                  onClick={() => void handleDelete(tag)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#E5E7EB] text-red-500 items-center justify-center hidden group-hover/tag:flex shadow-sm"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {tags.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#E5E7EB] p-4 text-center">
          <Tag className="w-6 h-6 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-xs text-[#6B7280]">
            Nenhuma tag ainda. Use um atalho ou crie a sua.
          </p>
        </div>
      )}

      {!readOnly && (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Atalhos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.nome}
                  type="button"
                  disabled={busy}
                  onClick={() => void handlePreset(p)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-dashed border-[#D4C4F0] text-[#4C258C] hover:bg-[#F3EEFA] transition-colors"
                  style={{ backgroundColor: `${p.cor_fundo}99` }}
                >
                  + {p.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-[#D4C4F0] bg-[#FBF9FE] p-3 space-y-3">
            {!creating ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl border-[#D4C4F0] text-[#4C258C] hover:bg-[#F3EEFA]"
                onClick={() => setCreating(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Criar nova tag
              </Button>
            ) : (
              <>
                <p className="text-xs font-semibold text-[#4C258C]">Nova tag</p>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Nome</Label>
                  <Input
                    value={newNome}
                    onChange={(e) => setNewNome(e.target.value)}
                    placeholder="Ex.: Edição limitada"
                    className="h-9 rounded-lg text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleCreate();
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Cores</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_SWATCHES.map((c) => {
                      const active =
                        newFundo === c.cor_fundo && newTexto === c.cor_texto;
                      return (
                        <button
                          key={c.cor_fundo + c.cor_texto}
                          type="button"
                          onClick={() => {
                            setNewFundo(c.cor_fundo);
                            setNewTexto(c.cor_texto);
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform",
                            active
                              ? "border-[#4C258C] scale-110"
                              : "border-white shadow-sm"
                          )}
                          style={{ backgroundColor: c.cor_fundo }}
                          title={c.cor_fundo}
                        />
                      );
                    })}
                  </div>
                  <div
                    className="inline-flex mt-1 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: newFundo, color: newTexto }}
                  >
                    {newNome.trim() || "Prévia"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setCreating(false);
                      setNewNome("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || !newNome.trim()}
                    className="flex-1 rounded-lg bg-[#4C258C] hover:bg-[#5E35B1]"
                    onClick={() => void handleCreate()}
                  >
                    {busy && (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    )}
                    Criar e usar
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
