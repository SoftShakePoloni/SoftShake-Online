import type { Category } from "@/data/tipos";
import { ProductCard } from "./CardProduto";

export function ProductSection({ category }: { category: Category }) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">{category.name}</h2>
        {category.subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{category.subtitle}</p>
        )}
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {category.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
