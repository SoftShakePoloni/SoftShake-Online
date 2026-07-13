"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RefreshCw,
  Plus,
  Package,
  Users,
  BarChart3,
  UtensilsCrossed,
  Settings,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import {
  getDashboardData,
  type DashboardData,
  type DashboardPeriod,
} from "@/actions/admin/dashboard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { STATUS_META, shortOrderId } from "@/components/admin/pedidos/order-status";
import type { PedidoStatus } from "@/types/pedido";

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
];

const QUICK_ACTIONS = [
  { href: "/admin/pedidos", label: "Pedidos", icon: Package },
  { href: "/admin/produtos", label: "Novo produto", icon: Plus },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/produtos", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

const PIE_COLORS = ["#111827", "#6B7280", "#9CA3AF", "#D1D5DB", "#4C258C"];

function money(n: number) {
  return formatCurrency(n);
}

function ChangeBadge({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-[12px] text-[#9CA3AF]">0%</span>;
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "text-[12px] font-medium tabular-nums",
        up ? "text-emerald-600" : "text-red-600"
      )}
    >
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

function Panel({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-[#E5E7EB] bg-white p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-[#111827]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function statusLabel(status: string) {
  const meta = STATUS_META[status as PedidoStatus];
  return meta?.label || status;
}

function statusClass(status: string) {
  const meta = STATUS_META[status as PedidoStatus];
  return meta?.badge || "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
}

interface DashboardViewProps {
  initialData: DashboardData;
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState<DashboardPeriod>(initialData.period);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: DashboardPeriod) => {
    setLoading(true);
    try {
      const next = await getDashboardData(p);
      setData(next);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePeriod = (p: DashboardPeriod) => {
    setPeriod(p);
    startTransition(() => {
      void load(p);
    });
  };

  const handleRefresh = () => {
    void load(period);
  };

  // Realtime: refetch leve ao mudar pedidos
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void load(period);
      }, 600);
    };

    const channel = supabase
      .channel("dashboard-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        schedule
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [period, load]);

  const dateLabel = useMemo(
    () =>
      format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }),
    []
  );

  const busy = loading || isPending;

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5 py-4 space-y-4">
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] text-[#6B7280] capitalize">{dateLabel}</p>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              {data.storeName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePeriod(p.id)}
                  className={cn(
                    "h-8 px-2.5 rounded text-[12px] font-medium transition-colors",
                    period === p.id
                      ? "bg-[#111827] text-white"
                      : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busy}
              className="h-8 px-2.5 rounded-md border border-[#E5E7EB] bg-white text-[12px] font-medium text-[#111827] hover:bg-[#F9FAFB] disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", busy && "animate-spin")}
              />
              Atualizar
            </button>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]"
              >
                <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
                {a.label}
              </Link>
            );
          })}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Kpi
            label="Pedidos"
            value={String(data.kpis.pedidos)}
            change={data.kpis.pedidosChange}
            loading={busy}
          />
          <Kpi
            label="Faturamento"
            value={money(data.kpis.faturamento)}
            change={data.kpis.faturamentoChange}
            loading={busy}
          />
          <Kpi
            label="Ticket médio"
            value={money(data.kpis.ticketMedio)}
            change={data.kpis.ticketMedioChange}
            loading={busy}
          />
          <Kpi
            label="Pedidos em aberto"
            value={String(data.kpis.emAberto)}
            highlight={data.kpis.emAberto > 0}
            loading={busy}
          />
        </div>

        {/* Pedidos recentes + Top produtos */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <Panel
            title="Pedidos recentes"
            className="lg:col-span-3"
            action={
              <Link
                href="/admin/pedidos"
                className="text-[12px] font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Ver todos
                <ExternalLink className="w-3 h-3" />
              </Link>
            }
          >
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 pr-2 font-medium">Pedido</th>
                    <th className="pb-2 pr-2 font-medium">Cliente</th>
                    <th className="pb-2 pr-2 font-medium">Valor</th>
                    <th className="pb-2 pr-2 font-medium">Status</th>
                    <th className="pb-2 pr-2 font-medium">Horário</th>
                    <th className="pb-2 font-medium text-right"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {data.recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-[#9CA3AF]"
                      >
                        Nenhum pedido ainda
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAFAFA]">
                        <td className="py-2 pr-2 font-semibold text-[#111827] tabular-nums">
                          #{shortOrderId(o.id)}
                        </td>
                        <td className="py-2 pr-2 text-[#374151] truncate max-w-[120px]">
                          {o.cliente}
                        </td>
                        <td className="py-2 pr-2 font-medium tabular-nums text-[#111827]">
                          {money(o.valor)}
                        </td>
                        <td className="py-2 pr-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border",
                              statusClass(o.status)
                            )}
                          >
                            {statusLabel(o.status)}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-[#6B7280] tabular-nums whitespace-nowrap">
                          {format(new Date(o.createdAt), "HH:mm", {
                            locale: ptBR,
                          })}
                        </td>
                        <td className="py-2 text-right">
                          <Link
                            href="/admin/pedidos"
                            className="text-[12px] font-medium text-blue-600 hover:underline"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Produtos mais vendidos" className="lg:col-span-2">
            {data.topProducts.length === 0 ? (
              <p className="text-[13px] text-[#9CA3AF] py-6 text-center">
                Sem vendas no período
              </p>
            ) : (
              <ol className="divide-y divide-[#F3F4F6]">
                {data.topProducts.map((p, i) => (
                  <li
                    key={`${p.nome}-${i}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[12px] font-semibold text-[#9CA3AF] w-4 tabular-nums">
                        {i + 1}.
                      </span>
                      <span className="text-[13px] font-medium text-[#111827] truncate">
                        {p.nome}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#6B7280] tabular-nums shrink-0">
                      {p.quantidade} vendas
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Panel
            title={
              period === "hoje" || period === "ontem"
                ? "Vendas por horário"
                : "Vendas por dia"
            }
            className="lg:col-span-2"
          >
            <div className="h-[220px] w-full">
              {data.salesByDay.every((d) => d.receita === 0) ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.salesByDay}
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
                      contentStyle={{
                        borderRadius: 6,
                        border: "1px solid #E5E7EB",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [money(value), "Receita"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="receita"
                      stroke="#111827"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>

          <Panel title="Forma de pagamento">
            <div className="h-[220px] w-full">
              {data.payments.length === 0 ? (
                <EmptyChart />
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.payments}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {data.payments.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 6,
                            border: "1px solid #E5E7EB",
                            fontSize: 12,
                          }}
                          formatter={(value: number, name: string) => [
                            money(value),
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {data.payments.slice(0, 4).map((p, i) => (
                      <li
                        key={p.name}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <span className="flex items-center gap-1.5 text-[#6B7280] truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          {p.name}
                        </span>
                        <span className="font-medium text-[#111827] tabular-nums">
                          {p.percentage}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Pedidos por horário + atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <Panel title="Pedidos por horário" className="lg:col-span-3">
            <div className="h-[200px] w-full">
              {data.hourly.every((h) => h.pedidos === 0) ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.hourly}
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
                    <Tooltip
                      contentStyle={{
                        borderRadius: 6,
                        border: "1px solid #E5E7EB",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="pedidos"
                      fill="#6B7280"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>

          <Panel title="Últimas atividades" className="lg:col-span-2">
            <ActivityList orders={data.recentOrders} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  change,
  highlight,
  loading,
}: {
  label: string;
  value: string;
  change?: number;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-white px-3.5 py-3">
      <p className="text-[12px] text-[#6B7280]">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-24 rounded bg-[#F3F4F6] animate-pulse" />
      ) : (
        <div className="mt-1 flex items-end justify-between gap-2">
          <p
            className={cn(
              "text-[28px] font-bold leading-none tabular-nums tracking-tight",
              highlight ? "text-orange-600" : "text-[#111827]"
            )}
          >
            {value}
          </p>
          {typeof change === "number" && <ChangeBadge value={change} />}
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-[13px] text-[#9CA3AF]">
      Sem dados no período
    </div>
  );
}

function ActivityList({
  orders,
}: {
  orders: DashboardData["recentOrders"];
}) {
  if (orders.length === 0) {
    return (
      <p className="text-[13px] text-[#9CA3AF] py-6 text-center">
        Nenhuma atividade recente
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#F3F4F6]">
      {orders.slice(0, 8).map((o) => {
        const label = statusLabel(o.status);
        return (
          <li key={o.id} className="py-2 first:pt-0 last:pb-0">
            <p className="text-[13px] text-[#111827]">
              Pedido #{shortOrderId(o.id)} — {label}
            </p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              {o.cliente}
              <span className="mx-1 text-[#D1D5DB]">·</span>
              {format(new Date(o.createdAt), "HH:mm", { locale: ptBR })}
              <span className="mx-1 text-[#D1D5DB]">·</span>
              {money(o.valor)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
