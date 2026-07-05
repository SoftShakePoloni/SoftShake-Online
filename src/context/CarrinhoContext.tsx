import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@/data/tipos";

export type ItemCarrinho = {
  uid: string;
  produto: Product;
  qty: number;
  selections: Record<string, string[]>;
  observacoes: string;
  total: number;
};

type CarrinhoContextType = {
  itens: ItemCarrinho[];
  adicionarItem: (item: Omit<ItemCarrinho, "uid">) => void;
  removerItem: (uid: string) => void;
  limpar: () => void;
  totalItens: number;
  subtotal: number;
  cupom: string;
  setCupom: (v: string) => void;
  descontoCupom: number;
};

const CarrinhoContext = createContext<CarrinhoContextType | null>(null);

// Cupons de exemplo — futuramente pode vir do Supabase
const CUPONS: Record<string, number> = {
  SHAKE10: 0.10,
  BEMVINDO: 0.15,
};

const STORAGE_KEY = 'carrinho-itens';
const CUPOM_KEY = 'carrinho-cupom';

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [cupom, setCupomState] = useState("");
  const [descontoCupom, setDescontoCupom] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Carrega do localStorage na montagem
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedCupom = localStorage.getItem(CUPOM_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setItens(parsed);
      }
      
      if (storedCupom) {
        const upper = storedCupom.toUpperCase();
        setCupomState(upper);
        setDescontoCupom(CUPONS[upper] ?? 0);
      }
    } catch {
      // Erro ao carregar carrinho do localStorage
    }
    setHydrated(true);
  }, []);

  // Salva no localStorage quando itens mudam
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
      } catch {
        // Erro ao salvar carrinho no localStorage
      }
    }
  }, [itens, hydrated]);

  // Salva cupom no localStorage
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(CUPOM_KEY, cupom);
      } catch {
        // Erro ao salvar cupom no localStorage
      }
    }
  }, [cupom, hydrated]);

  const adicionarItem = (item: Omit<ItemCarrinho, "uid">) => {
    const uid = `${item.produto.id}-${Date.now()}`;
    setItens((prev) => [...prev, { ...item, uid }]);
  };

  const removerItem = (uid: string) => setItens((prev) => prev.filter((i) => i.uid !== uid));
  
  const limpar = () => { 
    setItens([]);
    setCupomState("");
    setDescontoCupom(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUPOM_KEY);
  };

  const setCupom = (v: string) => {
    const upper = v.toUpperCase();
    setCupomState(upper);
    setDescontoCupom(CUPONS[upper] ?? 0);
  };

  const totalItens = itens.reduce((s, i) => s + i.qty, 0);
  const subtotal = itens.reduce((s, i) => s + i.total, 0);

  return (
    <CarrinhoContext.Provider value={{
      itens, adicionarItem, removerItem, limpar,
      totalItens, subtotal, cupom, setCupom, descontoCupom,
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho deve ser usado dentro de CarrinhoProvider");
  return ctx;
}

export function resumoOpcoes(produto: Product, selections: Record<string, string[]>): string {
  const partes: string[] = [];
  for (const grupo of produto.optionGroups ?? []) {
    if (grupo.id === "obs") continue;
    const ids = selections[grupo.id] ?? [];
    const nomes = ids.map((id) => grupo.items.find((i) => i.id === id)?.name ?? "").filter(Boolean);
    if (nomes.length) partes.push(...nomes);
  }
  return partes.join(", ");
}
