"use client";

import { useState } from "react";
import { CalendarDays, Loader2, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCupom, deleteCupom, type Cupom } from "@/actions/admin/cupons";

function hojeLocal() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function dinheiro(value: number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBR(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export function CuponsManager({ initial, loadError }: { initial: Cupom[]; loadError: string | null }) {
  const [items, setItems] = useState(initial);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<Cupom["tipo"]>("percentual");
  const [valor, setValor] = useState("");
  const [valorMinimo, setValorMinimo] = useState("0");
  const [limiteUsos, setLimiteUsos] = useState("");
  const [dataInicio, setDataInicio] = useState(hojeLocal);
  const [dataFim, setDataFim] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const item = await createCupom({
        codigo,
        nome,
        tipo,
        valor: Number(valor),
        valor_minimo: Number(valorMinimo || 0),
        limite_usos: limiteUsos ? Number(limiteUsos) : null,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
      });
      setItems((current) => [item, ...current]);
      setCodigo("");
      setNome("");
      setValor("");
      setValorMinimo("0");
      setLimiteUsos("");
      setDataFim("");
      toast.success("Cupom criado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o cupom.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cupom: Cupom) => {
    try {
      await deleteCupom(cupom.id);
      setItems((current) => current.filter((item) => item.id !== cupom.id));
      toast.success(`Cupom ${cupom.codigo} removido`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o cupom.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F8FC] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex items-center gap-4 rounded-2xl border border-[#E5DCEE] bg-white px-5 py-5 shadow-sm sm:px-7">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3EDF9] text-[#4C258C]"><TicketPercent className="h-6 w-6" /></div>
          <div><h1 className="text-xl font-semibold tracking-tight text-[#25212A]">Cupons</h1><p className="mt-1 text-[13px] text-[#77717D]">Crie códigos de desconto para seus clientes.</p></div>
        </header>

        {loadError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{loadError}</p>}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-[#E7E3EA] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#F0EDF3] px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F0F8] text-[#4C258C]"><Plus className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-semibold text-[#29252E]">Novo cupom</h2><p className="mt-0.5 text-xs text-[#89838F]">Configure o desconto e as condições.</p></div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="coupon-code">Código</Label><Input id="coupon-code" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="EX: BEMVINDO" required maxLength={32} className="uppercase" /></div>
              <div className="space-y-1.5"><Label htmlFor="coupon-name">Nome interno</Label><Input id="coupon-name" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Primeira compra" required maxLength={80} /></div>
              <div className="space-y-1.5"><Label>Tipo de desconto</Label><Select value={tipo} onValueChange={(v) => setTipo(v as Cupom["tipo"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentual">Percentual (%)</SelectItem><SelectItem value="valor_fixo">Valor fixo (R$)</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="coupon-value">Desconto {tipo === "percentual" ? "(%)" : "(R$)"}</Label><Input id="coupon-value" type="number" min="0.01" max={tipo === "percentual" ? 100 : undefined} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label htmlFor="coupon-minimum">Pedido mínimo (R$)</Label><Input id="coupon-minimum" type="number" min="0" step="0.01" value={valorMinimo} onChange={(e) => setValorMinimo(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="coupon-limit">Limite de usos</Label><Input id="coupon-limit" type="number" min="1" step="1" value={limiteUsos} onChange={(e) => setLimiteUsos(e.target.value)} placeholder="Sem limite" /></div>
              <div className="space-y-1.5"><Label htmlFor="coupon-start">Válido a partir de</Label><Input id="coupon-start" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label htmlFor="coupon-end">Válido até</Label><Input id="coupon-end" type="date" min={dataInicio} value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
            </div>
            <div className="flex justify-end border-t border-[#F0EDF3] bg-[#FCFBFD] px-5 py-4"><Button type="submit" disabled={saving || Boolean(loadError)} className="bg-[#4C258C] hover:bg-[#3F1E76]">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Criar cupom</Button></div>
          </form>

          <section className="overflow-hidden rounded-2xl border border-[#E7E3EA] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EEEAF1] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#29252E]">Cupons cadastrados</h2><p className="mt-0.5 text-xs text-[#89838F]">Descontos configurados para o checkout</p></div><span className="rounded-full bg-[#F4F0F8] px-3 py-1 text-[11px] font-semibold text-[#4C258C]">{items.length}</span></div>
            {items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left"><thead className="bg-[#FAF9FB] text-[10px] font-semibold uppercase tracking-wide text-[#817A87]"><tr><th className="px-5 py-3">Cupom</th><th className="px-5 py-3">Desconto</th><th className="px-5 py-3">Usos</th><th className="px-5 py-3">Validade</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-[#F0EDF3]">{items.map((item) => <tr key={item.id} className="hover:bg-[#FCFBFD]"><td className="px-5 py-4"><p className="font-semibold text-sm text-[#29252E]">{item.codigo}</p><p className="mt-0.5 text-xs text-[#89838F]">{item.nome}</p></td><td className="px-5 py-4 text-sm text-[#514B59]">{item.tipo === "percentual" ? `${item.valor}%` : dinheiro(item.valor)}<p className="mt-0.5 text-[11px] text-[#89838F]">Mín. {dinheiro(item.valor_minimo)}</p></td><td className="px-5 py-4 text-sm text-[#514B59]">{item.usos}{item.limite_usos == null ? " / ∞" : ` / ${item.limite_usos}`}</td><td className="px-5 py-4 text-xs text-[#514B59]"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#817A87]" />{item.data_fim ? `${dataBR(item.data_inicio)} – ${dataBR(item.data_fim)}` : `Desde ${dataBR(item.data_inicio)}`}</span></td><td className="px-5 py-4 text-right"><Button type="button" variant="ghost" size="icon" aria-label={`Excluir cupom ${item.codigo}`} onClick={() => void remove(item)} className="text-[#8A838F] hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div> : <div className="px-6 py-12 text-center"><TicketPercent className="mx-auto h-5 w-5 text-[#AAA4B0]" /><p className="mt-3 text-sm font-medium text-[#514B59]">Nenhum cupom cadastrado</p><p className="mt-1 text-xs text-[#89838F]">Seus cupons aparecerão aqui.</p></div>}
          </section>
        </div>
      </div>
    </div>
  );
}
