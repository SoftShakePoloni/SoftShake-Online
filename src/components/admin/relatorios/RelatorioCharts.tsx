"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NomeValor,
  SerieDia,
  SerieHora,
} from "@/types/relatorios";

/** Paleta: vermelho da marca + cinzas */
const RED = "#DC2626";
const RED_SOFT = "#F87171";
const GRAY = "#6B7280";
const GRAY_LIGHT = "#D1D5DB";
const GRAY_DARK = "#111827";

const PIE_COLORS = [RED, GRAY_DARK, GRAY, GRAY_LIGHT, RED_SOFT];

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 12,
  boxShadow: "none",
};

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

function Empty({ msg = "Sem dados no período" }: { msg?: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-[13px] text-[#9CA3AF]">
      {msg}
    </div>
  );
}

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Evolução das vendas — linha */
export function ChartFaturamento({ data }: { data: SerieDia[] }) {
  const has = data.some((d) => d.faturamento > 0);
  return (
    <Panel title="Evolução das vendas" className="lg:col-span-2">
      {!has ? (
        <Empty />
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [money(value), "Faturamento"]}
              />
              <Line
                type="monotone"
                dataKey="faturamento"
                stroke={RED}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: RED }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

/** Pedidos por horário — barras */
export function ChartHoras({ data }: { data: SerieHora[] }) {
  const has = data.some((d) => d.pedidos > 0);
  return (
    <Panel title="Pedidos por horário">
      {!has ? (
        <Empty />
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="hora"
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="pedidos"
                fill={GRAY}
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

/** Forma de pagamento — rosca */
export function ChartPizza({ data }: { data: NomeValor[] }) {
  return (
    <Panel title="Forma de pagamento">
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="h-[220px] flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    money(value),
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 mt-1">
            {data.slice(0, 5).map((p, i) => (
              <li
                key={p.name}
                className="flex items-center justify-between text-[12px]"
              >
                <span className="flex items-center gap-1.5 text-[#6B7280] truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {p.name}
                </span>
                <span className="font-medium text-[#111827] tabular-nums">
                  {p.percent != null ? `${p.percent}%` : money(p.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/** Pedidos por status — barras horizontais */
export function ChartPedidosBar({ data }: { data: NomeValor[] }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((d) => d.value), 1);

  return (
    <Panel title="Pedidos por status">
      {sorted.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-2.5 py-1">
          {sorted.map((row) => (
            <li key={row.name}>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-[#374151] font-medium">{row.name}</span>
                <span className="tabular-nums text-[#6B7280]">{row.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#DC2626]"
                  style={{ width: `${(row.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Categorias / ranking genérico em barras */
export function ChartCategorias({ data }: { data: NomeValor[] }) {
  const top = data.slice(0, 6);
  const max = Math.max(...top.map((d) => d.value), 1);

  return (
    <Panel title="Canais e tipos">
      {top.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-2.5 py-1">
          {top.map((row) => (
            <li key={row.name}>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-[#374151] font-medium truncate pr-2">
                  {row.name}
                </span>
                <span className="tabular-nums text-[#6B7280] shrink-0">
                  {typeof row.value === "number" && row.value > 100
                    ? money(row.value)
                    : row.value}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#6B7280]"
                  style={{ width: `${(row.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// Compat exports (nomes antigos usados em outros imports)
export function ChartMensal() {
  return null;
}
export function ChartSemana() {
  return null;
}
