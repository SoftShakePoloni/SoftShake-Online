"use client";

import type {
  ClienteRank,
  NomeValor,
  ProdutoRank,
} from "@/types/relatorios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        {description && (
          <p className="text-xs text-[#6B7280] mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg = "Nenhum dado no período" }: { msg?: string }) {
  return (
    <div className="py-10 text-center text-sm text-[#9CA3AF]">{msg}</div>
  );
}

export function TabelaProdutos({ data }: { data: ProdutoRank[] }) {
  return (
    <Card title="Produtos mais vendidos" description="Por quantidade e faturamento">
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F3F4F6]">
                <th className="pb-2 font-medium">Produto</th>
                <th className="pb-2 font-medium text-right">Qtd</th>
                <th className="pb-2 font-medium text-right">Faturamento</th>
                <th className="pb-2 font-medium w-[30%]">Participação</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.nome}
                  className="border-b border-[#F9FAFB] last:border-0"
                >
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#EEE8FA] text-[#4C258C] text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-medium text-[#111827] truncate max-w-[180px]">
                        {row.nome}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[#4B5563]">
                    {row.quantidade}
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-medium text-[#111827]">
                    {money(row.faturamento)}
                  </td>
                  <td className="py-2.5 pl-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#4C258C] to-[#7C3AED]"
                          style={{
                            width: `${Math.min(100, row.participacao)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-[#6B7280] w-10 text-right">
                        {row.participacao}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function TabelaRanking({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: ProdutoRank[];
}) {
  return (
    <Card title={title} description={description}>
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2.5">
          {data.map((row, i) => (
            <div
              key={row.nome}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8F9FC] transition-colors"
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i < 3
                    ? "bg-[#4C258C] text-white"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] truncate">
                  {row.nome}
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  {row.quantidade}x · {money(row.faturamento)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TabelaTamanhos({ data }: { data: NomeValor[] }) {
  return (
    <Card title="Tamanhos mais vendidos" description="Distribuição por volume">
      {data.length === 0 ? (
        <Empty msg="Sem dados de tamanho nos itens" />
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-[#111827]">{row.name}</span>
                <span className="text-[#6B7280] tabular-nums">
                  {row.value} · {row.percent ?? 0}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#3B82F6]"
                  style={{ width: `${Math.min(100, row.percent ?? 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TabelaClientes({ data }: { data: ClienteRank[] }) {
  return (
    <Card title="Clientes" description="Top por valor gasto no período">
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F3F4F6]">
                <th className="pb-2 font-medium">Nome</th>
                <th className="pb-2 font-medium text-right">Pedidos</th>
                <th className="pb-2 font-medium text-right">Total gasto</th>
                <th className="pb-2 font-medium text-right">Ticket médio</th>
                <th className="pb-2 font-medium text-right">Última compra</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr
                  key={`${c.nome}-${c.telefone}`}
                  className="border-b border-[#F9FAFB] last:border-0"
                >
                  <td className="py-2.5">
                    <p className="font-medium text-[#111827]">{c.nome}</p>
                    {c.telefone && (
                      <p className="text-[11px] text-[#9CA3AF]">{c.telefone}</p>
                    )}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{c.pedidos}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">
                    {money(c.totalGasto)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[#6B7280]">
                    {money(c.ticketMedio)}
                  </td>
                  <td className="py-2.5 text-right text-[#6B7280] text-xs">
                    {format(new Date(c.ultimaCompra), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function ComparativosCards({
  items,
}: {
  items: {
    label: string;
    atual: number;
    anterior: number;
    deltaPct: number | null;
    format: "currency" | "number";
  }[];
}) {
  const fmt = (v: number, f: "currency" | "number") =>
    f === "currency"
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : String(v);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const positive = (item.deltaPct ?? 0) >= 0;
        return (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-all"
          >
            <p className="text-xs font-medium text-[#6B7280] mb-3">
              {item.label}
            </p>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xl font-bold text-[#111827] tabular-nums">
                  {fmt(item.atual, item.format)}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  Anterior: {fmt(item.anterior, item.format)}
                </p>
              </div>
              {item.deltaPct != null && (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                    positive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {positive ? "+" : ""}
                  {item.deltaPct}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
