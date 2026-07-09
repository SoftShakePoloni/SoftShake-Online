"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
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
  SerieMes,
  SerieSemana,
} from "@/types/relatorios";

const COLORS = [
  "#4C258C",
  "#7C3AED",
  "#A78BFA",
  "#22C55E",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: "10px 12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

function Card({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow ${className}`}
    >
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

function EmptyChart({ msg = "Sem dados no período" }: { msg?: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-sm text-[#9CA3AF]">
      {msg}
    </div>
  );
}

export function ChartFaturamento({ data }: { data: SerieDia[] }) {
  const has = data.some((d) => d.faturamento > 0 || d.faturamentoAnterior > 0);
  return (
    <Card
      title="Faturamento"
      description="Diário · linha sólida atual · tracejada período anterior"
      className="xl:col-span-2"
    >
      {!has ? (
        <EmptyChart />
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fatAtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
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
                tickFormatter={(v) =>
                  v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`
                }
                width={56}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  value.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
                  name === "faturamento" ? "Atual" : "Período anterior",
                ]}
              />
              <Area
                type="monotone"
                dataKey="faturamento"
                stroke="#7C3AED"
                strokeWidth={2.5}
                fill="url(#fatAtual)"
              />
              <Line
                type="monotone"
                dataKey="faturamentoAnterior"
                stroke="#D1D5DB"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function ChartPedidosBar({ data }: { data: SerieDia[] }) {
  const has = data.some((d) => d.pedidos > 0);
  return (
    <Card title="Pedidos por dia" description="Quantidade diária no período">
      {!has ? (
        <EmptyChart />
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} pedidos`, "Pedidos"]}
              />
              <Bar dataKey="pedidos" fill="#4C258C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function ChartPizza({
  title,
  description,
  data,
  donut = false,
}: {
  title: string;
  description?: string;
  data: NomeValor[];
  donut?: boolean;
}) {
  const has = data.some((d) => d.value > 0);
  return (
    <Card title={title} description={description}>
      {!has ? (
        <EmptyChart />
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={donut ? 58 : 0}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name, item) => {
                  const payload = item?.payload as { percent?: number } | undefined;
                  return [
                    `${Number(value)} (${payload?.percent ?? 0}%)`,
                    String(name),
                  ];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-[#4B5563]">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function ChartHoras({ data }: { data: SerieHora[] }) {
  const has = data.some((d) => d.pedidos > 0);
  return (
    <Card title="Horários de pico" description="Pedidos por hora do dia">
      {!has ? (
        <EmptyChart />
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="hora"
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="pedidos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function ChartSemana({ data }: { data: SerieSemana[] }) {
  const has = data.some((d) => d.pedidos > 0);
  const max = Math.max(...data.map((d) => d.pedidos), 1);
  return (
    <Card title="Dias da semana" description="Qual dia vende mais">
      {!has ? (
        <EmptyChart />
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="pedidos" radius={[6, 6, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.pedidos === max && entry.pedidos > 0
                        ? "#4C258C"
                        : "#C4B5FD"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function ChartMensal({ data }: { data: SerieMes[] }) {
  const has = data.some((d) => d.faturamento > 0);
  return (
    <Card
      title="Receita mensal"
      description="Últimos 12 meses"
      className="xl:col-span-2"
    >
      {!has ? (
        <EmptyChart />
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fatMes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                }
                width={56}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [
                  value.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
                  "Faturamento",
                ]}
              />
              <Area
                type="monotone"
                dataKey="faturamento"
                stroke="#16A34A"
                strokeWidth={2.5}
                fill="url(#fatMes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
