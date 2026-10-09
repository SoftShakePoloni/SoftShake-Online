"use client";

import { useMemo, useState } from "react";
import { Gift, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCombo, deleteCombo, type ComboAdmin } from "@/actions/admin/combos";
import type { CatalogProduto } from "./types";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CombosTab({ products, initial, loadError }: { products: CatalogProduto[]; initial: ComboAdmin[]; loadError: string | null }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const chosen = useMemo(() => Object.entries(selected).filter(([, quantity]) => quantity > 0), [selected]);
  const referencePrice = useMemo(() => chosen.reduce((sum, [id, quantity]) => {
    const product = products.find((item) => String(item.id) === id);
    return sum + Number(product?.preco_base ?? 0) * quantity;
  }, 0), [chosen, products]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const combo = await createCombo({
        nome: name,
        descricao: description,
        preco: Number(price),
        itens: chosen.map(([id, quantidade]) => ({ produto_id: Number(id), quantidade })),
      });
      setItems((current) => [combo, ...current]);
      setName(""); setDescription(""); setPrice(""); setSelected({});
      toast.success("Combo criado e publicado no cardápio");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o combo.");
    } finally { setSaving(false); }
  };

  const remove = async (combo: ComboAdmin) => {
    try {
      await deleteCombo(combo.id);
      setItems((current) => current.filter((item) => item.id !== combo.id));
      toast.success("Combo removido do cardápio");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o combo.");
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FC] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {loadError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{loadError}</div>}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-[#E7E3EA] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#F0EDF3] px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F0F8] text-[#4C258C]"><Plus className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-semibold text-[#29252E]">Montar combo</h2><p className="mt-0.5 text-xs text-[#89838F]">Combine produtos e defina um preço especial.</p></div>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-1.5"><Label htmlFor="combo-name">Nome do combo</Label><Input id="combo-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Combo Açaí + Água" maxLength={100} required /></div>
              <div className="space-y-1.5"><Label htmlFor="combo-description">Descrição (opcional)</Label><Textarea id="combo-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Uma combinação para aproveitar junto." rows={2} /></div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-[#514B59]">Produtos incluídos</legend>
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-[#E7E3EA] p-2">
                  {products.map((product) => {
                    const key = String(product.id);
                    const quantity = selected[key] ?? 0;
                    return <div key={key} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#FAF9FB]">
                      <input type="checkbox" checked={quantity > 0} onChange={(e) => setSelected((current) => ({ ...current, [key]: e.target.checked ? 1 : 0 }))} aria-label={`Incluir ${product.nome}`} className="h-4 w-4 accent-[#4C258C]" />
                      <span className="min-w-0 flex-1 truncate text-sm text-[#29252E]">{product.nome}</span>
                      <span className="text-xs text-[#817A87]">{moeda(Number(product.preco_base))}</span>
                      {quantity > 0 && <Input aria-label={`Quantidade de ${product.nome}`} type="number" min="1" max="20" value={quantity} onChange={(e) => setSelected((current) => ({ ...current, [key]: Math.min(20, Math.max(1, Number(e.target.value) || 1)) }))} className="h-8 w-16 text-center" />}
                    </div>;
                  })}
                  {products.length === 0 && <p className="p-3 text-sm text-[#89838F]">Cadastre produtos antes de montar combos.</p>}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="combo-reference">Valor separado</Label><Input id="combo-reference" value={moeda(referencePrice)} disabled className="bg-[#F7F8FC]" /></div>
                <div className="space-y-1.5"><Label htmlFor="combo-price">Preço do combo</Label><Input id="combo-price" type="number" min="0.01" max={referencePrice > 0 ? (referencePrice - 0.01).toFixed(2) : undefined} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="R$" required /></div>
              </div>
              {referencePrice > Number(price) && Number(price) > 0 && <p className="text-xs font-medium text-emerald-700">Economia de {moeda(referencePrice - Number(price))} no combo.</p>}
            </div>
            <div className="flex justify-end border-t border-[#F0EDF3] bg-[#FCFBFD] px-5 py-4"><Button type="submit" disabled={saving || Boolean(loadError) || chosen.length < 2} className="bg-[#4C258C] hover:bg-[#3F1E76]">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}Criar combo</Button></div>
          </form>

          <section className="overflow-hidden rounded-2xl border border-[#E7E3EA] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EEEAF1] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#29252E]">Combos publicados</h2><p className="mt-0.5 text-xs text-[#89838F]">Visíveis no cardápio da loja</p></div><span className="rounded-full bg-[#F4F0F8] px-3 py-1 text-[11px] font-semibold text-[#4C258C]">{items.length}</span></div>
            {items.length ? <ul className="divide-y divide-[#F0EDF3]">{items.map((combo) => <li key={combo.id} className="flex items-start gap-3 px-5 py-4"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F0F8] text-[#4C258C]"><Gift className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#29252E]">{combo.nome}</p><p className="mt-1 text-xs leading-relaxed text-[#77717D]">{combo.itens.map((item) => `${item.quantidade}× ${item.nome}`).join(" · ")}</p><p className="mt-2 text-sm font-semibold text-[#4C258C]">{moeda(combo.preco)} <span className="ml-1 text-xs font-normal text-[#89838F]">(avulso {moeda(combo.itens.reduce((sum, item) => sum + item.preco_base * item.quantidade, 0))})</span></p></div><Button type="button" variant="ghost" size="icon" aria-label={`Excluir combo ${combo.nome}`} onClick={() => void remove(combo)} className="shrink-0 text-[#8A838F] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></li>)}</ul> : <div className="px-6 py-12 text-center"><Gift className="mx-auto h-5 w-5 text-[#AAA4B0]" /><p className="mt-3 text-sm font-medium text-[#514B59]">Nenhum combo publicado</p><p className="mt-1 text-xs text-[#89838F]">Os combos criados aparecerão no cardápio automaticamente.</p></div>}
          </section>
        </div>
      </div>
    </div>
  );
}
