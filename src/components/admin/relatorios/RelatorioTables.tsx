"use client";

import type {
  ClienteRank,
  Comparativo,
  ProdutoRank,
} from "@/types/relatorios";
import { cn } from "@/lib/utils";

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md border border-[#E5E7EB] bg-white p-4 ${className}`}
    >
      <h3 className="text-[13px] font-semibold text-[#111827] mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ msg = "Nenhum dado no período" }: { msg?: string }) {
  return (
    <div className="py-8 text-center text-[13px] text-[#9CA3AF]">{msg}</div>
  );
}

export function TabelaProdutos({ data }: { data: ProdutoRank[] }) {
  return (
    <Panel title="Produtos mais vendidos">
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                <th className="pb-2 pr-2 font-medium">Produto</th>
                <th className="pb-2 pr-2 font-medium text-right">Qtd</th>
                <th className="pb-2 pr-2 font-medium text-right">Receita</th>
                <th className="pb-2 font-medium text-right">Part.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {data.map((row, i) => (
                <tr key={row.nome} className="hover:bg-[#FAFAFA]">
                  <td className="py-2 pr-2">
                    <span className="text-[#9CA3AF] tabular-nums mr-1.5">
                      {i + 1}.
                    </span>
                    <span className="font-medium text-[#111827]">
                      {row.nome}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-[#6B7280]">
                    {row.quantidade}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums font-semibold text-[#111827]">
                    {money(row.faturamento)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-[#6B7280]">
                    {row.participacao}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function TabelaClientes({ data }: { data: ClienteRank[] }) {
  const totalPedidos = data.reduce((s, c) => s + c.pedidos, 0);
  const recorrentes = data.filter((c) => c.pedidos >= 2).length;
  const novos = data.filter((c) => c.pedidos === 1).length;
  const top = data[0];
  const ticketMedio =
    data.length > 0
      ? data.reduce((s, c) => s + c.ticketMedio, 0) / data.length
      : 0;
  const freqMedia =
    data.length > 0 ? totalPedidos / data.length : 0;

  return (
    <Panel title="Clientes">
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Novos (1 pedido)" value={String(novos)} />
            <Stat label="Recorrentes" value={String(recorrentes)} />
            <Stat
              label="Frequência média"
              value={`${freqMedia.toFixed(1)} ped.`}
            />
            <Stat label="Ticket médio" value={money(ticketMedio)} />
          </div>
          {top && (
            <div className="rounded-md border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5">
              <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">
                Maior comprador
              </p>
              <p className="text-[13px] font-semibold text-[#111827] mt-0.5">
                {top.nome}
              </p>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                {top.pedidos} pedidos · {money(top.totalGasto)}
              </p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#E5E7EB] px-2.5 py-2">
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      <p className="text-[15px] font-bold text-[#111827] tabular-nums mt-0.5">
        {value}
      </p>
    </div>
  );
}

export function ComparativosCards({ data }: { data: Comparativo[] }) {
  // Preferidos do brief: hoje x ontem, mês, ano
  const preferred = ["Hoje x Ontem", "Este mês x Mês passado", "Este ano x Ano passado"];
  const list =
    data.filter((c) => preferred.some((p) => c.label.includes(p.split(" x ")[0]) || preferred.includes(c.label)))
      .length > 0
      ? data.filter((c) =>
          ["Hoje", "mês", "ano", "Mês", "Ano"].some((k) =>
            c.label.includes(k)
          )
        )
      : data;

  return (
    <Panel title="Comparativo">
      <ul className="divide-y divide-[#F3F4F6]">
        {list.map((c) => {
          const d = c.deltaPct;
          const up = (d ?? 0) >= 0;
          return (
            <li
              key={c.label}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-[13px] text-[#374151]">{c.label}</span>
              <span
                className={cn(
                  "text-[13px] font-semibold tabular-nums",
                  d == null
                    ? "text-[#9CA3AF]"
                    : up
                      ? "text-emerald-600"
                      : "text-red-600"
                )}
              >
                {d == null
                  ? "—"
                  : `${up ? "▲ +" : "▼ "}${d}%`}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function TabelaRanking({
  title,
  data,
}: {
  title: string;
  data: { nome: string; quantidade: number; faturamento?: number }[];
}) {
  return (
    <Panel title={title}>
      {data.length === 0 ? (
        <Empty />
      ) : (
        <ol className="divide-y divide-[#F3F4F6]">
          {data.slice(0, 8).map((row, i) => (
            <li
              key={row.nome}
              className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
            >
              <span className="text-[13px] text-[#111827] truncate">
                <span className="text-[#9CA3AF] mr-1.5">{i + 1}.</span>
                {row.nome}
              </span>
              <span className="text-[12px] text-[#6B7280] tabular-nums shrink-0">
                {row.quantidade}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function TabelaTamanhos({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <TabelaRanking
      title="Tamanhos"
      data={data.map((d) => ({ nome: d.name, quantidade: d.value }))}
    />
  );
}
