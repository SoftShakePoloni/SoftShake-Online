"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, notesOptionGroup, type OptionGroup, type Product } from "@/data/tipos";
import { useCarrinho } from "@/context/CarrinhoContext";
import { TagBadge } from "@/components/ui/TagBadge";

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductDetailDialog({ product, open, onOpenChange }: Props) {
  const { adicionarItem } = useCarrinho();
  const groups = product?.optionGroups ?? [notesOptionGroup];
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

  // Lógica dinâmica de limites para açaí
  const getDynamicMaxForGroup = (group: OptionGroup): number => {
    // Verifica se o produto é açaí pelo nome
    const isAcai = product.name.toLowerCase().includes('açaí') || product.name.toLowerCase().includes('acai');
    
    if (!isAcai) return group.max;

    // Identifica grupos que são de tamanho ou sabor (obrigatórios, não devem ter limite dinâmico)
    const groupNameLower = group.name.toLowerCase();
    const isSizeOrFlavorGroup = groupNameLower.includes('tamanho') || groupNameLower.includes('sabor');

    // Se for grupo de tamanho ou sabor, retorna o max original
    if (isSizeOrFlavorGroup) return group.max;

    // Para qualquer outro grupo (cremes, adicionais, etc), aplicar a lógica dinâmica
    // Busca o grupo de tamanho para verificar qual foi selecionado
    const sizeGroup = groups.find(g => 
      g.name.toLowerCase().includes('tamanho')
    );

    if (!sizeGroup) return group.max;

    const selectedSizeId = selections[sizeGroup.id]?.[0];
    if (!selectedSizeId) return group.max;

    const selectedSizeItem = sizeGroup.items.find(item => item.id === selectedSizeId);
    if (!selectedSizeItem) return group.max;

    // Extrai o tamanho em ml do nome da opção
    const sizeName = selectedSizeItem.name.toLowerCase();
    if (sizeName.includes('300')) return 3;
    if (sizeName.includes('400')) return 4;
    if (sizeName.includes('500')) return 5;

    return group.max;
  };

  // Verifica se é um grupo de adicionais compartilhados (para açaí)
  const isSharedAddonsGroup = (group: OptionGroup): boolean => {
    const isAcai = product.name.toLowerCase().includes('açaí') || product.name.toLowerCase().includes('acai');
    if (!isAcai) return false;
    
    const groupNameLower = group.name.toLowerCase();
    const isSizeOrFlavorGroup = groupNameLower.includes('tamanho') || groupNameLower.includes('sabor');
    return !isSizeOrFlavorGroup && group.id !== 'obs';
  };

  // Calcula total de itens selecionados em todos os grupos de adicionais compartilhados
  const getTotalSharedAddonsSelected = (): number => {
    return groups
      .filter(isSharedAddonsGroup)
      .reduce((total, g) => {
        return total + (selections[g.id] ?? []).length;
      }, 0);
  };

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
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const has = current.includes(itemId);
      const dynamicMax = getDynamicMaxForGroup(group);
      
      // Para grupos compartilhados, verifica o total geral
      if (isSharedAddonsGroup(group)) {
        const totalSelected = groups
          .filter(isSharedAddonsGroup)
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

  const total = (product.price + extras) * qty;

  const canAdd = groups.every((g) => {
    if (!g.required) return true;
    const count = (selections[g.id] ?? []).length;
    return count >= (g.min ?? 1);
  });

  const handleAdicionar = () => {
    adicionarItem({
      produto: product,
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
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col gap-0 overflow-hidden border-0 p-0 sm:h-[92vh] sm:max-h-[92vh] sm:rounded-2xl">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">{product.description}</DialogDescription>

        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
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
            <p className="pt-1 text-base font-semibold text-foreground">
              {formatBRL(product.price)}
            </p>
          </div>

          {/* Option groups */}
          <div className="space-y-3 pb-4">
            {groups.map((g) => {
              const selected = selections[g.id] ?? [];
              const dynamicMax = getDynamicMaxForGroup(g);
              const isShared = isSharedAddonsGroup(g);
              const totalSharedSelected = isShared ? getTotalSharedAddonsSelected() : selected.length;
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
                    {/* Itens selecionados primeiro */}
                    {g.items
                      .filter(item => selected.includes(item.id))
                      .map((item) => {
                        const isSelected = true;
                        const isRadio = g.max === 1;
                        return (
                          <li key={item.id} className="bg-primary/5">
                            <button
                              type="button"
                              onClick={() => toggle(g, item.id)}
                              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition"
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                                  {item.tag && <TagBadge tag={item.tag} />}
                                </div>
                                {item.priceDelta ? (
                                  <span className="text-xs text-muted-foreground">
                                    + {formatBRL(item.priceDelta)}
                                  </span>
                                ) : null}
                              </div>
                              <span
                                className={[
                                  "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition",
                                  isRadio ? "rounded-full" : "rounded",
                                  "border-primary bg-primary",
                                ].join(" ")}
                              >
                                {isRadio ? (
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
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    
                    {/* Itens não selecionados */}
                    {g.items
                      .filter(item => !selected.includes(item.id))
                      .map((item) => {
                        const isSelected = false;
                        const totalSelected = isShared ? totalSharedSelected : selected.length;
                        const disabled = !isSelected && g.max > 1 && totalSelected >= displayMax;
                        const isRadio = g.max === 1;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => toggle(g, item.id)}
                              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition disabled:opacity-50"
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-foreground">{item.name}</span>
                                  {item.tag && <TagBadge tag={item.tag} />}
                                </div>
                                {item.priceDelta ? (
                                  <span className="text-xs text-muted-foreground">
                                    + {formatBRL(item.priceDelta)}
                                  </span>
                                ) : null}
                              </div>
                              <span
                                className={[
                                  "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition",
                                  isRadio ? "rounded-full" : "rounded",
                                  "border-muted-foreground/40 bg-card",
                                ].join(" ")}
                              />
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
        <div className="flex items-center gap-3 border-t border-border bg-card px-4 py-3">
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
            disabled={!canAdd}
            onClick={handleAdicionar}
            className="flex flex-1 items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Adicionar</span>
            <span>{formatBRL(total)}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
