"use client";

import { ProductSection } from "@/components/cardapio/SecaoProdutos";
import { useMenu } from "@/hooks/useCardapio";

export default function PaginaPromocoes() {
  const { categories, isLoading, error } = useMenu();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <h1 className="mb-6 text-3xl font-bold">Promoções</h1>
      {isLoading && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Carregando promoções...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Erro ao carregar promoções: {error}
        </div>
      )}
      {!isLoading && !error && categories.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma promoção disponível no momento.
        </div>
      )}
      <div className="space-y-8">
        {categories.map((c) => (
          <ProductSection key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}
