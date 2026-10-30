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

export type CupomCarrinho = { codigo: string; nome: string; desconto: number };

type CarrinhoContextType = {
  cupomAplicado: CupomCarrinho | null;
  setCupomAplicado: (cupom: CupomCarrinho | null) => void;
  itens: ItemCarrinho[];
  adicionarItem: (item: Omit<ItemCarrinho, "uid">) => void;
  removerItem: (uid: string) => void;
  limpar: () => void;
  totalItens: number;
  subtotal: number;
};

const CarrinhoContext = createContext<CarrinhoContextType | null>(null);

const STORAGE_KEY = 'carrinho-itens';

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [cupomAplicado, setCupomAplicado] = useState<CupomCarrinho | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Carrega do localStorage na montagem
  useEffect(() => {
    try {
      const savedCoupon = sessionStorage.getItem("sacola-cupom");
      if (savedCoupon) {
        const coupon = JSON.parse(savedCoupon);
        if (typeof coupon.codigo === "string" && typeof coupon.desconto === "number") setCupomAplicado(coupon);
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItens(parsed);
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

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (cupomAplicado && itens.length) sessionStorage.setItem("sacola-cupom", JSON.stringify(cupomAplicado));
      else sessionStorage.removeItem("sacola-cupom");
    } catch { /* Cart remains usable when storage is unavailable. */ }
    if (!itens.length && cupomAplicado) setCupomAplicado(null);
  }, [cupomAplicado, hydrated, itens.length]);

  const adicionarItem = (item: Omit<ItemCarrinho, "uid">) => {
    const uid = `${item.produto.id}-${Date.now()}`;
    setItens((prev) => [...prev, { ...item, uid }]);
  };

  const removerItem = (uid: string) => setItens((prev) => prev.filter((i) => i.uid !== uid));
  
  const limpar = () => { 
    setItens([]);
    setCupomAplicado(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalItens = itens.reduce((s, i) => s + i.qty, 0);
  const subtotal = itens.reduce((s, i) => s + i.total, 0);

  return (
    <CarrinhoContext.Provider value={{
      itens, adicionarItem, removerItem, limpar, cupomAplicado, setCupomAplicado,
      totalItens, subtotal,
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
  if (produto.comboOptionsMode === "fixo") return (produto.comboFixedChoices ?? []).map(choice => `${choice.groupName}: ${choice.name}`).join(", ");
  const partes: string[] = [];
  for (const grupo of produto.optionGroups ?? []) {
    if (grupo.id === "obs") continue;
    const ids = selections[grupo.id] ?? [];
    const nomes = ids.map((id) => grupo.items.find((i) => i.id === id)?.name ?? "").filter(Boolean);
    if (nomes.length) partes.push(...nomes.map(name => produto.comboId ? `${grupo.name}: ${name}` : name));
  }
  return partes.join(", ");
}
