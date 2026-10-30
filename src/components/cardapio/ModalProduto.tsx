"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  formatBRL,
  getProductUnitPrice,
  notesOptionGroup,
  type OptionGroup,
  type Product,
} from "@/data/tipos";
import { PrecoProduto } from "./PrecoProduto";
import { useCarrinho } from "@/context/CarrinhoContext";
import { TagBadge } from "@/components/ui/TagBadge";
import { FreteGratisBadge } from "@/components/ui/FreteGratisBadge";
import { useLoja } from "@/hooks/useLoja";
import { toast } from "sonner";
import { comboGroupLimit, isSharedComboAddon, resolveComboChoices } from "@/lib/combos/options";

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductDetailDialog({ product, open, onOpenChange }: Props) {
  const { adicionarItem } = useCarrinho();
  const { loja, isLoading } = useLoja();
  const pathname = usePathname();
  const lojaAberta = isLoading ? true : Boolean(loja?.esta_aberto);
  const [loadedOptionGroups, setLoadedOptionGroups] = useState<OptionGroup[] | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const groups = loadedOptionGroups ?? product?.optionGroups ?? [notesOptionGroup];

  useEffect(() => {
    setLoadedOptionGroups(null);
    if (!open || !product || product.comboId || !/^\d+$/.test(product.id)) return;
    if ((product.optionGroups ?? []).some((group) => group.id !== "obs")) return;

    let cancelled = false;
    setOptionsLoading(true);
    fetch(`/api/cardapio/produto/${product.id}/opcoes`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar as opções do produto.");
        return response.json() as Promise<{ optionGroups: OptionGroup[] }>;
      })
      .then((data) => { if (!cancelled) setLoadedOptionGroups(data.optionGroups); })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Falha ao carregar opções.");
      })
      .finally(() => { if (!cancelled) setOptionsLoading(false); });

    return () => { cancelled = true; };
  }, [open, product]);

  // Fecha ao trocar de aba na bottom nav
  useEffect(() => {
    if (open) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelections({});
    setQty(1);
    setNotes("");
    sectionRefs.current = {};
  }, [product?.id]);

  if (!product) return null;

  const getDynamicMaxForGroup = (group: OptionGroup) => comboGroupLimit(group, groups, selections, product.name);
  const isSharedAddonsGroup = (group: OptionGroup) => isSharedComboAddon(group, product.name);
  const getTotalSharedAddonsSelected = (group: OptionGroup) => groups
    .filter(g => g.comboUnitKey === group.comboUnitKey && isSharedAddonsGroup(g))
    .reduce((total, g) => total + (selections[g.id] ?? []).length, 0);

  // Função para rolar para a próxima seção
  const scrollToNextSection = (currentGroupId: string) => {
    const currentIndex = groups.findIndex(g => g.id === currentGroupId);
    if (currentIndex === -1 || currentIndex >= groups.length - 1) return;

    const nextGroup = groups[currentIndex + 1];
    const nextSection = sectionRefs.current[nextGroup.id];
    
    if (nextSection && scrollContainerRef.current) {
      // Pequeno delay para garantir que a UI atualizou
      setTimeout(() => {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const toggle = (group: OptionGroup, itemId: string) => {
    // Verifica se o item está disponível
    const item = group.items.find((i) => i.id === itemId);
    if (item && item.disponivel === false) {
      toast.error("Item esgotado", {
        description: "Este complemento está indisponível no momento.",
      });
      return;
    }

    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const has = current.includes(itemId);
      const dynamicMax = getDynamicMaxForGroup(group);
      if (!has && group.max !== 1 && current.length >= dynamicMax) return prev;
      
      // Para grupos compartilhados, verifica o total geral
      if (isSharedAddonsGroup(group)) {
        const totalSelected = groups
          .filter(g => g.comboUnitKey === group.comboUnitKey && isSharedAddonsGroup(g))
          .reduce((total, g) => {
            return total + (prev[g.id] ?? []).length;
          }, 0);
        
        // Se não tem o item selecionado e já atingiu o limite geral, bloqueia
        if (!has && totalSelected >= dynamicMax) {
          return prev;
        }
      }
      
      let next: string[];
      if (group.max === 1) {
        next = has ? [] : [itemId];
        // Se for seleção única (radio) e está selecionando (não removendo), rola para próxima seção
        if (!has) {
          scrollToNextSection(group.id);
        }
      } else {
        if (has) next = current.filter((id) => id !== itemId);
        else next = [...current, itemId];
      }
      return { ...prev, [group.id]: next };
    });
  };

  const extras = groups.reduce((sum, g) => {
    const ids = selections[g.id] ?? [];
    return (
      sum +
      ids.reduce((s, id) => {
        const it = g.items.find((i) => i.id === id);
        return s + (it?.priceDelta ?? 0);
      }, 0)
    );
  }, 0);

  const unitPrice = getProductUnitPrice(product);
  const total = (unitPrice + extras) * qty;

  let comboValid = true;
  if (product.comboOptionsMode === "cliente") {
    try { resolveComboChoices(groups.filter(group => group.id !== "obs"), selections); } catch { comboValid = false; }
  }
  const canAdd = comboValid && !optionsLoading && product.disponivel !== false && groups.every((g) => {
    if (!g.required) return true;
    const count = (selections[g.id] ?? []).length;
    return count >= (g.min ?? 1);
  });

  const handleAdicionar = () => {
    if (!lojaAberta) {
      toast.error("Loja fechada", {
        description: "No momento não estamos aceitando pedidos.",
      });
      return;
    }

    if (!canAdd) return;
    adicionarItem({
      produto: { ...product, optionGroups: groups },
      qty,
      selections,
      observacoes: notes,
      total,
    });
    
    // Limpar todas as seleções após adicionar
    setSelections({});
    setQty(1);
    setNotes("");
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="z-[80] max-md:bottom-0" className="z-[90] flex h-dvh max-h-dvh w-full max-w-md flex-col gap-0 overflow-hidden border-0 p-0 top-0 translate-y-0 rounded-none md:top-[50%] md:translate-y-[-50%] md:h-[92dvh] md:max-h-[92dvh] md:rounded-2xl">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">{product.description}</DialogDescription>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" ref={scrollContainerRef}>
          {/* Image */}
          <div className="relative aspect-square w-full bg-muted">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            ) : null}
          </div>

          {/* Header info */}
          <div className="space-y-2 bg-card px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
              {product.tag && <TagBadge tag={product.tag} />}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            {product.freteGratis && <FreteGratisBadge prazo={product.freteGratisPrazo} />}
            <div className="pt-1">
              <PrecoProduto product={product} size="lg" />
            </div>
          </div>

          {product.comboOptionsMode === "fixo" && Boolean(product.comboFixedChoices?.length) && <section className="space-y-2 bg-card px-5 pb-5">
            <h3 className="text-sm font-semibold">Este combo inclui</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">{product.comboFixedChoices?.map(choice => <li key={choice.groupId + choice.id}>{choice.groupName}: {choice.name}</li>)}</ul>
          </section>}
          {/* Option groups */}
          <div className="space-y-3 pb-4">
            {groups.map((g) => {
              const selected = selections[g.id] ?? [];
              const dynamicMax = getDynamicMaxForGroup(g);
              const isShared = isSharedAddonsGroup(g);
              const totalSharedSelected = isShared ? getTotalSharedAddonsSelected(g) : selected.length;
              const displayMax = isShared ? dynamicMax : g.max;
              
              if (g.id === "obs") {
                return (
                  <section 
                    key={g.id} 
                    ref={(el) => { sectionRefs.current[g.id] = el; }}
                  >
                    <header className="flex items-center justify-between bg-muted px-5 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{g.name}</h3>
                        {g.helper && <p className="text-xs text-muted-foreground">{g.helper}</p>}
                      </div>
                    </header>
                    <div className="bg-card px-5 py-4">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        aria-label="Observações do pedido"
                        placeholder="Ex: sem amendoim, capricha na cobertura..."
                        className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </section>
                );
              }
              return (
                <section 
                  key={g.id}
                  ref={(el) => { sectionRefs.current[g.id] = el; }}
                >
                  <header className="flex items-center justify-between gap-3 bg-muted px-5 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{g.name}</h3>
                        {g.tag && <TagBadge tag={g.tag} />}
                      </div>
                      {g.helper && (
                        <p className="text-xs text-muted-foreground">
                          {/* Para grupos compartilhados de açaí, mostra o helper dinâmico */}
                          {isShared ? (
                            <>
                              Escolha até{' '}
                              <span className="text-destructive">{displayMax}</span>
                              {' '}opções
                            </>
                          ) : (
                            g.helper.split(/(\d+)/).map((part, i) =>
                              /^\d+$/.test(part) ? (
                                <span key={i} className="text-destructive">
                                  {part}
                                </span>
                              ) : (
                                <span key={i}>{part}</span>
                              ),
                            )
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-foreground/80 px-2 py-0.5 text-[11px] font-semibold text-background">
                        {totalSharedSelected} / {displayMax}
                      </span>
                      {g.required && (
                        <span className="rounded bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background">
                          OBRIGATÓRIO
                        </span>
                      )}
                    </div>
                  </header>
                  <ul className="divide-y divide-border bg-card">
                    {/* Disponíveis primeiro (selecionados no topo), esgotados no fim com tarja */}
                    {[
                      ...g.items.filter(
                        (item) =>
                          item.disponivel !== false &&
                          selected.includes(item.id)
                      ),
                      ...g.items.filter(
                        (item) =>
                          item.disponivel !== false &&
                          !selected.includes(item.id)
                      ),
                      ...g.items.filter((item) => item.disponivel === false),
                    ].map((item) => {
                      const isSelected = selected.includes(item.id);
                      const isUnavailable = item.disponivel === false;
                      const totalSelected = isShared
                        ? totalSharedSelected
                        : selected.length;
                      const disabled =
                        isUnavailable ||
                        (!isSelected &&
                          g.max > 1 &&
                          totalSelected >= displayMax);
                      const isRadio = g.max === 1;

                      return (
                        <li
                          key={item.id}
                          className={
                            isUnavailable
                              ? "relative overflow-hidden bg-muted/40"
                              : isSelected
                                ? "bg-primary/5"
                                : ""
                          }
                        >
                          {/* Tarja diagonal — só em esgotados */}
                          {isUnavailable && (
                            <>
                              <div
                                className="pointer-events-none absolute inset-0 z-10 bg-black/10"
                                aria-hidden
                              />
                              <div
                                className="pointer-events-none absolute top-3 -right-10 z-20 w-36 rotate-45 bg-red-600 py-1 text-center shadow-md"
                                aria-hidden
                              >
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                                  Indisponível
                                </span>
                              </div>
                            </>
                          )}

                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              !isUnavailable && toggle(g, item.id)
                            }
                            className={[
                              "relative z-[5] flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition",
                              isUnavailable
                                ? "cursor-not-allowed"
                                : "hover:bg-muted/30",
                              isSelected && !isUnavailable
                                ? ""
                                : "",
                            ].join(" ")}
                          >
                            <div className="flex min-w-0 flex-col pr-8">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={[
                                    "text-sm font-medium",
                                    isUnavailable
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground",
                                  ].join(" ")}
                                >
                                  {item.name}
                                </span>
                                {isUnavailable && (
                                  <span className="inline-flex items-center rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Esgotado
                                  </span>
                                )}
                                {item.tag && !isUnavailable && (
                                  <TagBadge tag={item.tag} />
                                )}
                              </div>
                              {item.priceDelta ? (
                                <span
                                  className={[
                                    "text-xs",
                                    isUnavailable
                                      ? "text-muted-foreground/70 line-through"
                                      : "text-muted-foreground",
                                  ].join(" ")}
                                >
                                  + {formatBRL(item.priceDelta)}
                                </span>
                              ) : null}
                            </div>

                            {!isUnavailable && (
                              <span
                                className={[
                                  "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition",
                                  isRadio ? "rounded-full" : "rounded",
                                  isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/40 bg-card",
                                ].join(" ")}
                              >
                                {isSelected &&
                                  (isRadio ? (
                                    <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                                  ) : (
                                    <svg
                                      viewBox="0 0 12 12"
                                      className="h-3 w-3 text-primary-foreground"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2.5}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="2.5,6.5 5,9 9.5,3.5" />
                                    </svg>
                                  ))}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-3 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1.5">
            <button
              type="button"
              aria-label="Diminuir"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-5 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={!canAdd || !lojaAberta}
            onClick={handleAdicionar}
            className="flex flex-1 items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{lojaAberta ? "Adicionar" : "Loja fechada"}</span>
            <span>{formatBRL(total)}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
