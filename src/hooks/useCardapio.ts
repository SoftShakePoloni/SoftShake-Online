import { useEffect, useState } from "react";
import { fetchMenu } from "@/data/cardapio";
import type { Category } from "@/data/tipos";

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMenu()
      .then((menu) => {
        if (!isMounted) return;
        setCategories(menu);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Não foi possível carregar o cardápio.";
        setError(message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, isLoading, error };
}
