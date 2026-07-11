"use server";

import { createServiceRoleClient } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin/auth";

type PedidoRow = {
  id: string | number;
  total: number;
  status: string;
  created_at: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  meio_pagamento?: string | null;
  endereco_completo?: unknown;
  itens?: unknown;
};

/**
 * Dashboard com poucas queries paralelas + agregação em memória.
 * Antes: dezenas de round-trips sequenciais (lento em toda visita à home).
 */
export async function getDashboardData() {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Janela ampla: 6 meses (cobre monthly chart + last month + this month + 7 days)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    { data: ordersWindow },
    { count: totalClients },
    { data: recentClients },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, total, status, created_at, cliente_id, cliente_nome, meio_pagamento, endereco_completo, itens"
      )
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase
      .from("clientes")
      .select("id, nome, email, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("pedidos")
      .select(
        "id, total, status, created_at, cliente_nome, meio_pagamento, endereco_completo"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const allOrders = (ordersWindow || []) as PedidoRow[];

  const inRange = (iso: string, start: Date, end: Date) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t < end.getTime();
  };

  const ordersThisMonth = allOrders.filter((o) =>
    inRange(o.created_at, firstDayOfMonth, tomorrow)
  );
  // last month inclusive through end of last day
  const ordersLastMonth = allOrders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= firstDayOfLastMonth.getTime() && t <= lastDayOfLastMonth.getTime();
  });
  const ordersToday = allOrders.filter((o) =>
    inRange(o.created_at, today, tomorrow)
  );

  const revenueThisMonth =
    ordersThisMonth.reduce((sum, order) => sum + Number(order.total || 0), 0) ||
    0;
  const revenueLastMonth =
    ordersLastMonth.reduce((sum, order) => sum + Number(order.total || 0), 0) ||
    0;
  const revenueToday =
    ordersToday.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

  const ordersCountThisMonth = ordersThisMonth.length;
  const ordersCountLastMonth = ordersLastMonth.length;
  const ordersCountToday = ordersToday.length;

  const paidOrders = ordersThisMonth.filter((o) => o.status === "pago").length;
  const pendingOrders = ordersThisMonth.filter(
    (o) => o.status === "pendente"
  ).length;
  const cancelledOrders = ordersThisMonth.filter(
    (o) => o.status === "cancelado"
  ).length;

  const avgTicket =
    ordersCountThisMonth > 0 ? revenueThisMonth / ordersCountThisMonth : 0;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Last 7 days — pure in-memory bucket
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayRevenue = allOrders
      .filter((o) => inRange(o.created_at, dayStart, dayEnd))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    last7DaysData.push({
      date: date.toISOString().split("T")[0],
      revenue: dayRevenue,
      label: date.toLocaleDateString("pt-BR", { weekday: "short" }),
    });
  }

  // Monthly revenue last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const monthRevenue = allOrders
      .filter((o) => inRange(o.created_at, monthStart, monthEnd))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    monthlyData.push({
      label: date.toLocaleDateString("pt-BR", { month: "short" }),
      revenue: monthRevenue,
    });
  }

  const activeClients = new Set(
    ordersThisMonth.map((o) => o.cliente_id).filter(Boolean)
  ).size;

  // Top products from this month's order items
  const productSales: Record<
    string,
    {
      id: string;
      nome: string;
      categoria: string;
      imagem?: string;
      quantidade: number;
      receita: number;
    }
  > = {};

  type DashItem = {
    qty?: number;
    total?: number;
    produto?: {
      id?: string | number;
      name?: string;
      categoria?: string;
      image?: string;
    };
  };

  for (const order of ordersThisMonth) {
    const itens = (
      Array.isArray(order.itens) ? order.itens : []
    ) as DashItem[];
    for (const item of itens) {
      const produto = item.produto;
      if (!produto?.id) continue;
      const produtoId = String(produto.id);
      if (!productSales[produtoId]) {
        productSales[produtoId] = {
          id: produtoId,
          nome: produto.name || "Produto",
          categoria: produto.categoria || "Sem categoria",
          imagem: produto.image,
          quantidade: 0,
          receita: 0,
        };
      }
      productSales[produtoId].quantidade += item.qty || 1;
      productSales[produtoId].receita += item.total || 0;
    }
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5);

  // Recent customers — 1 extra query for their orders (all client ids at once)
  const recentClientIds = (recentClients || []).map((c) => c.id);
  let ordersByClient = new Map<string, PedidoRow[]>();

  if (recentClientIds.length > 0) {
    const { data: clientOrders } = await supabase
      .from("pedidos")
      .select("id, total, status, created_at, cliente_id")
      .in("cliente_id", recentClientIds);

    for (const order of (clientOrders || []) as PedidoRow[]) {
      const cid = String(order.cliente_id || "");
      if (!cid) continue;
      const list = ordersByClient.get(cid) || [];
      list.push(order);
      ordersByClient.set(cid, list);
    }
  }

  const recentCustomers = (recentClients || []).map((cliente) => {
    const clientOrders = ordersByClient.get(cliente.id) || [];
    const totalPedidos = clientOrders.length;
    const totalGasto = clientOrders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    );
    const sorted = [...clientOrders].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const ultimoPedido = sorted[0]?.created_at
      ? new Date(sorted[0].created_at)
      : new Date(cliente.created_at);

    let tipo: "novo" | "recorrente" | "vip" = "novo";
    if (totalPedidos >= 10 || totalGasto >= 500) {
      tipo = "vip";
    } else if (totalPedidos >= 3) {
      tipo = "recorrente";
    }

    return {
      id: cliente.id,
      nome: cliente.nome || "Cliente",
      email: cliente.email || "",
      totalPedidos,
      totalGasto,
      ultimoPedido,
      tipo,
    };
  });

  const paymentMethods: Record<string, { count: number; total: number }> = {};
  for (const order of ordersThisMonth) {
    const method = order.meio_pagamento || "outro";
    if (!paymentMethods[method]) {
      paymentMethods[method] = { count: 0, total: 0 };
    }
    paymentMethods[method].count++;
    paymentMethods[method].total += Number(order.total || 0);
  }

  const totalPayments = Object.values(paymentMethods).reduce(
    (sum, m) => sum + m.total,
    0
  );
  const paymentMethodsData = Object.entries(paymentMethods).map(
    ([name, data]) => ({
      name,
      value: data.total,
      percentage:
        totalPayments > 0
          ? Math.round((data.total / totalPayments) * 100)
          : 0,
    })
  );

  const hourlyOrders: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourlyOrders[i] = 0;
  for (const order of ordersThisMonth) {
    const hour = new Date(order.created_at).getHours();
    hourlyOrders[hour]++;
  }

  const hourlyData = Object.entries(hourlyOrders)
    .filter(([hour]) => parseInt(hour, 10) >= 8 && parseInt(hour, 10) <= 23)
    .map(([hour, count]) => ({
      hora: `${hour.padStart(2, "0")}h`,
      pedidos: count,
    }));

  const recentOrdersData = ((recentOrders || []) as PedidoRow[]).map(
    (order) => {
      const end = order.endereco_completo;
      let enderecoLabel = "Endereço não informado";
      if (typeof end === "string" && end.trim()) {
        enderecoLabel = end;
      } else if (end && typeof end === "object" && !Array.isArray(end)) {
        const obj = end as {
          logradouro?: string;
          bairro?: string;
          cidade?: string;
        };
        enderecoLabel =
          obj.logradouro ||
          [obj.bairro, obj.cidade].filter(Boolean).join(", ") ||
          "Endereço não informado";
      }
      return {
        id: String(order.id),
        cliente: order.cliente_nome || "Cliente",
        endereco: enderecoLabel,
        pagamento: order.meio_pagamento || "Não informado",
        status: order.status,
        tempo: new Date(order.created_at),
        valor: Number(order.total || 0),
      };
    }
  );

  return {
    revenue: {
      total: revenueThisMonth,
      today: revenueToday,
      change: calculateChange(revenueThisMonth, revenueLastMonth),
    },
    orders: {
      total: ordersCountThisMonth,
      today: ordersCountToday,
      paid: paidOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      change: calculateChange(ordersCountThisMonth, ordersCountLastMonth),
    },
    clients: {
      total: totalClients || 0,
      active: activeClients,
    },
    avgTicket,
    last7DaysData,
    monthlyData,
    topProducts,
    recentCustomers,
    paymentMethodsData,
    hourlyData,
    recentOrders: recentOrdersData,
  };
}
