"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Info, Share, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { useCarrinho } from "@/context/CarrinhoContext";
import { formatBRL } from "@/data/tipos";
import { cn } from "@/lib/utils";
import type { CupomVitrine } from "@/lib/cupons";

import { CUPOM_PENDENTE_KEY } from "@/lib/cupom-pendente";

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function rotuloDesconto(cupom: CupomVitrine) {
  return cupom.tipo === "percentual"
    ? `${Number.isInteger(cupom.valor) ? cupom.valor : cupom.valor.toFixed(1).replace(".", ",")}% OFF`
    : `${formatBRL(cupom.valor)} OFF`;
}

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

type Props = { cupons: CupomVitrine[]; erro: boolean };

export default function PaginaCupons({ cupons, erro }: Props) {
  const router = useRouter();

  const voltar = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <main className="mx-auto w-full max-w-3xl">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5 md:px-0">
        <button
          type="button"
          onClick={voltar}
          aria-label="Voltar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Cupons de desconto</h1>
      </header>

      {erro ? (
        <EstadoVazio texto="Não foi possível carregar os cupons agora. Tente novamente em instantes." acao={() => router.refresh()} />
      ) : cupons.length === 0 ? (
        <EstadoVazio texto="Nenhum cupom encontrado para este estabelecimento." />
      ) : (
        <ul className="grid gap-3 px-4 py-4 md:grid-cols-2 md:px-0">
          {cupons.map((cupom) => (
            <li key={cupom.codigo}>
              <CartaoCupom cupom={cupom} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function EstadoVazio({ texto, acao }: { texto: string; acao?: () => void }) {
  return (
    <div className="flex flex-col items-center px-8 pt-10 pb-16 text-center">
      <TicketPercent className="h-16 w-16 text-muted-foreground/60" strokeWidth={1.25} aria-hidden="true" />
      <p className="mt-5 max-w-xs text-sm text-muted-foreground">{texto}</p>
      {acao && (
        <button type="button" onClick={acao} className="mt-4 min-h-11 text-sm font-semibold text-primary underline">
          Tentar novamente
        </button>
      )}
    </div>
  );
}

function CartaoCupom({ cupom }: { cupom: CupomVitrine }) {
  const router = useRouter();
  const { itens, subtotal, cupomAplicado, setCupomAplicado } = useCarrinho();
  const [copiado, setCopiado] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const aplicado = cupomAplicado?.codigo === cupom.codigo;
  const detalhesId = `cupom-detalhes-${cupom.codigo}`;

  const copiar = async () => {
    if (await copiarTexto(cupom.codigo)) {
      setCopiado(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopiado(false), 2000);
    } else {
      toast.error("Não foi possível copiar o código.");
    }
  };

  const compartilhar = async () => {
    const texto = `Use o cupom ${cupom.codigo} e ganhe ${rotuloDesconto(cupom)} no SoftShake!`;
    const url = `${window.location.origin}/cupons`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Cupom SoftShake", text: texto, url });
      } catch {
        // cliente cancelou o compartilhamento
      }
      return;
    }
    if (await copiarTexto(`${texto} ${url}`)) toast.success("Mensagem copiada para compartilhar!");
    else toast.error("Não foi possível compartilhar.");
  };

  const aplicar = async () => {
    if (aplicado) return;
    if (itens.length === 0) {
      try {
        sessionStorage.setItem(CUPOM_PENDENTE_KEY, cupom.codigo);
      } catch {
        // sem storage: o cliente ainda pode digitar o código na sacola
      }
      toast.success(`Cupom ${cupom.codigo} guardado!`, {
        description: "Escolha seus itens — ele será aplicado ao abrir a sacola.",
      });
      router.push("/");
      return;
    }

    setAplicando(true);
    try {
      const resposta = await fetch("/api/cupons/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: cupom.codigo, subtotal }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível aplicar o cupom.");
      setCupomAplicado(dados.cupom);
      toast.success(`Cupom ${cupom.codigo} aplicado!`, {
        description: `Você economizou ${formatBRL(dados.cupom.desconto)}. Abra a sacola para finalizar.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aplicar o cupom.");
    } finally {
      setAplicando(false);
    }
  };

  const botaoIcone =
    "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex">
        {/* Lado do desconto */}
        <div className="relative flex w-[38%] shrink-0 flex-col items-center justify-center bg-primary/[0.07] px-2 py-5 text-center">
          <span className="text-2xl font-extrabold leading-none tracking-tight text-primary">{rotuloDesconto(cupom)}</span>
          <span className="mt-1 text-xs text-muted-foreground">nos itens</span>
          {/* Picote do ticket */}
          <span aria-hidden="true" className="absolute inset-y-3 right-0 border-r-2 border-dashed border-primary/30" />
          <span aria-hidden="true" className="absolute -top-2 -right-2 h-4 w-4 rounded-full border border-border bg-background" />
          <span aria-hidden="true" className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border border-border bg-background" />
        </div>

        {/* Lado das ações */}
        <div className="min-w-0 flex-1 p-3.5">
          <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">{cupom.codigo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {cupom.data_fim ? `Válido até ${formatarData(cupom.data_fim)}` : "Sem data de validade"}
          </p>

          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => void copiar()} aria-label={`Copiar código ${cupom.codigo}`} className={botaoIcone}>
              {copiado ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => void compartilhar()} aria-label={`Compartilhar cupom ${cupom.codigo}`} className={botaoIcone}>
              <Share className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDetalhes((v) => !v)}
              aria-label="Detalhes do cupom"
              aria-expanded={detalhes}
              aria-controls={detalhesId}
              className={cn(botaoIcone, detalhes && "border-primary/40 bg-primary/10 text-primary")}
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void aplicar()}
            disabled={aplicando || aplicado}
            className={cn(
              "mt-3 min-h-11 w-full rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed",
              aplicado
                ? "bg-primary/10 text-primary"
                : "bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-60",
            )}
          >
            {aplicado ? "Aplicado na sacola" : aplicando ? "Aplicando…" : "Aplicar"}
          </button>
        </div>
      </div>

      {detalhes && (
        <dl id={detalhesId} className="space-y-1 border-t border-dashed border-border bg-muted/40 px-4 py-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Cupom</dt>
            <dd className="text-right font-medium text-foreground">{cupom.nome}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Pedido mínimo</dt>
            <dd className="font-medium text-foreground">{cupom.valor_minimo > 0 ? formatBRL(cupom.valor_minimo) : "Sem mínimo"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Desconto</dt>
            <dd className="font-medium text-foreground">
              {cupom.tipo === "percentual" ? `${rotuloDesconto(cupom).replace(" OFF", "")} sobre os itens` : `${formatBRL(cupom.valor)} no valor dos itens`}
            </dd>
          </div>
          <p className="pt-1 text-muted-foreground">O desconto não se aplica à taxa de entrega.</p>
        </dl>
      )}
    </article>
  );
}
