"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Gift,
  Loader2,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPromocaoFrete,
  deletePromocaoFrete,
  type PromocaoFrete,
} from "@/actions/admin/promocoes-frete";
import type { CatalogProduto } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PromocoesFreteTab({
  products,
  initial,
  loadError,
}: {
  products: CatalogProduto[];
  initial: PromocaoFrete[];
  loadError: string | null;
}) {
  const [items, setItems] = useState(initial);
  const [product, setProduct] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!start || !end || !startTime || !endTime || end < start || (end === start && endTime < startTime)) {
      toast.error("Confira as datas e os horários da campanha.");
      return;
    }
    setSaving(true);
    try {
      const productId = product === "all" ? null : Number(product);
      const id = await createPromocaoFrete({
        produto_id: productId,
        data_inicio: start,
        data_fim: end,
        hora_inicio: startTime,
        hora_fim: endTime,
      });
      const created: PromocaoFrete = {
        id,
        produto_id: productId,
        data_inicio: start,
        data_fim: end,
        hora_inicio: startTime,
        hora_fim: endTime,
        ativa: true,
        produto:
          productId == null
            ? null
            : {
                nome:
                  products.find((item) => String(item.id) === product)?.nome ??
                  "Produto",
              },
      };
      setItems((current) => [created, ...current]);
      setStart("");
      setEnd("");
      setStartTime("00:00");
      setEndTime("23:59");
      setProduct("all");
      toast.success("Campanha criada");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a campanha."
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await deletePromocaoFrete(id);
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success("Campanha removida");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a campanha."
      );
    }
  };

  const dateLabel = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
  const campaignLabel = (item: PromocaoFrete) => {
    const startClock = item.hora_inicio.slice(0, 5);
    const endClock = item.hora_fim.slice(0, 5);
    if (item.data_inicio === item.data_fim) {
      return `${dateLabel(item.data_inicio)} · ${startClock}–${endClock}`;
    }
    return `${dateLabel(item.data_inicio)} às ${startClock} – ${dateLabel(item.data_fim)} às ${endClock}`;
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FC] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="relative overflow-hidden rounded-2xl border border-[#E5DCEE] bg-white px-5 py-5 shadow-sm sm:px-7 sm:py-6">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#4C258C]" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3EDF9] text-[#4C258C]">
              <Truck className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-[#25212A] sm:text-xl">
                  Frete grátis
                </h2>
                <span className="rounded-full border border-[#E7DDF0] bg-[#FAF7FC] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#67468D]">
                  Promoções
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-5 text-[#77717D]">
                Programe ofertas para toda a loja ou para produtos selecionados.
              </p>
            </div>
          </div>
        </header>

        {loadError && (
          <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold">Não foi possível carregar as campanhas</p>
              <p className="mt-1 text-amber-900">{loadError}</p>
            </div>
          </div>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <form
            onSubmit={submit}
            className="overflow-hidden rounded-2xl border border-[#E7E3EA] bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F0F8] text-[#4C258C]">
                <Plus className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#29252E]">Nova campanha</h3>
                <p className="mt-0.5 text-[12px] text-[#89838F]">Escolha o alcance e a validade da oferta.</p>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-2">
                <Label htmlFor="frete-product" className="text-[12px] font-medium text-[#514B59]">Aplicar a</Label>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger
                    id="frete-product"
                    className="h-11 rounded-lg border-[#E4E1E8] bg-white text-[13px] shadow-none focus:ring-[#4C258C]/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os produtos</SelectItem>
                    {products.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="frete-start" className="text-[12px] font-medium text-[#514B59]">
                    Começa em
                  </Label>
                  <div className="grid grid-cols-[minmax(0,1fr)_124px] gap-2">
                    <Input
                      id="frete-start"
                      type="date"
                      value={start}
                      onChange={(event) => setStart(event.target.value)}
                      required
                      aria-label="Data de início"
                      className="h-11 min-w-0 rounded-lg border-[#E4E1E8] text-[12px] shadow-none focus-visible:ring-[#4C258C]/20"
                    />
                    <Input
                      id="frete-start-time"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                      aria-label="Horário de início"
                      className="h-11 min-w-0 rounded-lg border-[#E4E1E8] px-2 text-[12px] shadow-none focus-visible:ring-[#4C258C]/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frete-end" className="text-[12px] font-medium text-[#514B59]">
                    Termina em
                  </Label>
                  <div className="grid grid-cols-[minmax(0,1fr)_124px] gap-2">
                    <Input
                      id="frete-end"
                      type="date"
                      value={end}
                      onChange={(event) => setEnd(event.target.value)}
                      min={start || undefined}
                      required
                      aria-label="Data de término"
                      className="h-11 min-w-0 rounded-lg border-[#E4E1E8] text-[12px] shadow-none focus-visible:ring-[#4C258C]/20"
                    />
                    <Input
                      id="frete-end-time"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                      aria-label="Horário de término"
                      className="h-11 min-w-0 rounded-lg border-[#E4E1E8] px-2 text-[12px] shadow-none focus-visible:ring-[#4C258C]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#F0EDF3] bg-[#FCFBFD] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[11px] text-[#89838F]">O horário considera o fuso local da loja.</p>
              <Button
                type="submit"
                disabled={saving || products.length === 0 || Boolean(loadError)}
                className="h-10 rounded-lg bg-[#4C258C] px-5 text-[13px] font-semibold shadow-sm hover:bg-[#3F1E76]"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="mr-2 h-4 w-4" />
                )}
                Agendar campanha
              </Button>
            </div>
          </form>

          <aside className="rounded-2xl border border-[#E7E3EA] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3 border-b border-[#F0EDF3] pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF5F0] text-[#467553]">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#29252E]">Regras da oferta</h3>
                <p className="mt-0.5 text-[11px] text-[#89838F]">O que o cliente verá</p>
              </div>
            </div>
            <div className="mt-4 space-y-4 text-[12px] leading-relaxed text-[#716B77]">
              <p>
                O destaque de frete grátis aparece nos produtos participantes enquanto a campanha estiver ativa.
              </p>
              <p>
                Em pedidos com entrega, a taxa é zerada quando há um produto participante. Na retirada, não há taxa de entrega.
              </p>
              <div className="flex gap-2.5 rounded-xl border border-[#E9E3F0] bg-[#FAF8FC] p-3 text-[#5A456F]">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Para uma oferta de um único dia, use a mesma data de início e término.</span>
              </div>
            </div>
          </aside>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#E7E3EA] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EEEAF1] px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-[14px] font-semibold text-[#29252E]">Campanhas cadastradas</h3>
              <p className="mt-0.5 text-[12px] text-[#89838F]">Campanhas gerais e por produto</p>
            </div>
            <span className="rounded-full bg-[#F4F0F8] px-3 py-1 text-[11px] font-semibold text-[#4C258C]">
              {items.length} {items.length === 1 ? "campanha" : "campanhas"}
            </span>
          </div>

          {items.length === 0 && !loadError ? (
            <div className="px-6 py-10 text-center">
              <CalendarDays className="mx-auto h-5 w-5 text-[#AAA4B0]" />
              <p className="mt-3 text-[13px] font-medium text-[#514B59]">
                Nenhuma campanha cadastrada
              </p>
              <p className="mt-1 text-[12px] text-[#89838F]">
                As campanhas que você criar aparecerão aqui.
              </p>
            </div>
          ) : items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-[#FAF9FB] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#817A87]">
                  <tr>
                    <th className="px-5 py-3.5 sm:px-6">Benefício</th>
                    <th className="px-5 py-3.5">Abrangência</th>
                    <th className="px-5 py-3.5">Vigência</th>
                    <th className="px-5 py-3.5 text-right sm:px-6">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDF3]">
                  {items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-[#FCFBFD]">
                      <td className="px-5 py-4 sm:px-6">
                        <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#467553]">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF5F0]"><Truck className="h-3.5 w-3.5" /></span>
                          Frete grátis
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-medium text-[#29252E]">
                          {item.produto?.nome ?? "Todos os produtos"}
                        </p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#89838F]">
                          {item.produto_id == null ? "Toda a loja" : "Produto específico"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-[12px] text-[#514B59]">
                          <CalendarDays className="h-4 w-4 shrink-0 text-[#817A87]" />
                          {campaignLabel(item)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover campanha de ${item.produto?.nome ?? "todos os produtos"}`}
                          onClick={() => void remove(item.id)}
                          className="h-8 w-8 rounded-lg text-[#8A838F] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-[13px] font-medium text-[#514B59]">A lista estará disponível após corrigir o carregamento.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
