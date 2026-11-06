"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { listTags, setTagDestaque, type TagRow } from "@/actions/admin/tags";
import { TagIcone } from "@/components/ui/TagIcone";
import { cn } from "@/lib/utils";
import type { CatalogProduto } from "./types";

/**
 * Escolhe qual tag ocupa o carrossel do topo do cardápio. Só uma por vez;
 * as demais tags continuam como mini tag nos produtos.
 */
export function DestaqueTopoCard({ produtos }: { produtos: CatalogProduto[] }) {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTags(await listTags());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Recarrega quando o admin cria/remove tags no painel do produto.
  useEffect(() => {
    if (!loading) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos]);

  const contagem = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of produtos) {
      if (p.tag_id == null) continue;
      const k = String(p.tag_id);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [produtos]);

  const destaqueId = tags.find((t) => t.destaque_cardapio)?.id ?? null;

  const escolher = async (id: number | null) => {
    if (id === destaqueId) return;
    setBusy(true);
    try {
      await setTagDestaque(id);
      setTags((prev) => prev.map((t) => ({ ...t, destaque_cardapio: t.id === id })));
      toast.success(
        id == null
          ? "Topo do cardápio sem destaque"
          : `“${tags.find((t) => t.id === id)?.nome}” agora fica no topo do cardápio`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar destaque");
    } finally {
      setBusy(false);
    }
  };

  if (!loading && tags.length === 0) return null;

  return (
    <section className="my-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#111827]">
            <Star className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
            Topo do cardápio
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">
            Escolha qual tag aparece em destaque no topo. Coloque essa tag em
            quantos produtos quiser. As outras tags aparecem como mini tag no
            produto.
          </p>
        </div>
        {(loading || busy) && <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />}
      </div>

      {!loading && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Tag do topo do cardápio"
        >
          <button
            type="button"
            role="radio"
            aria-checked={destaqueId == null}
            disabled={busy}
            onClick={() => void escolher(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              destaqueId == null
                ? "border-[#4C258C] bg-[#4C258C] text-white"
                : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D4C4F0]",
            )}
          >
            {destaqueId == null && <Check className="h-3.5 w-3.5" />}
            Nenhum
          </button>
          {tags.map((t) => {
            const active = destaqueId === t.id;
            const qtd = contagem.get(String(t.id)) ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => void escolher(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-[#4C258C] bg-[#4C258C] text-white"
                    : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D4C4F0]",
                )}
              >
                {active ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <TagIcone
                    nome={t.nome}
                    icone={t.icone}
                    cor={t.cor_fundo}
                    corSimbolo={t.cor_texto || "#FFFFFF"}
                    className="h-4 w-4"
                  />
                )}
                {t.nome}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px]",
                    active ? "bg-white/20" : "bg-[#F3F4F6] text-[#6B7280]",
                  )}
                  title={`${qtd} produto(s) com esta tag`}
                >
                  {qtd}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
