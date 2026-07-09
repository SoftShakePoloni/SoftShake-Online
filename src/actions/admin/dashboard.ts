"use server";

import { createServiceRoleClient } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin/auth";

export async function getDashboardData() {
  // Verify admin first
  await requireAdmin();
  const supabase = createServiceRoleClient();

  // Get current month dates
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get today's date
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all orders from this month
  const { data: ordersThisMonth } = await supabase
    .from("pedidos")
    .select("*")
    .gte("created_at", firstDayOfMonth.toISOString())
    .lte("created_at", lastDayOfMonth.toISOString());

  // Get all orders from last month
  const { data: ordersLastMonth } = await supabase
    .from("pedidos")
    .select("*")
    .gte("created_at", firstDayOfLastMonth.toISOString())
    .lte("created_at", lastDayOfLastMonth.toISOString());

  // Get today's orders
  const { data: ordersToday } = await supabase
    .from("pedidos")
    .select("*")
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString());

  // Get total clients
  const { count: totalClients } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  // Calculate all metrics
  const revenueThisMonth = ordersThisMonth?.reduce((sum, order) => sum + order.total, 0) || 0;
  const revenueLastMonth = ordersLastMonth?.reduce((sum, order) => sum + order.total, 0) || 0;
  const revenueToday = ordersToday?.reduce((sum, order) => sum + order.total, 0) || 0;

  const ordersCountThisMonth = ordersThisMonth?.length || 0;
  const ordersCountLastMonth = ordersLastMonth?.length || 0;
  const ordersCountToday = ordersToday?.length || 0;

  const paidOrders = ordersThisMonth?.filter((o) => o.status === "pago").length || 0;
  const pendingOrders = ordersThisMonth?.filter((o) => o.status === "pendente").length || 0;
  const cancelledOrders = ordersThisMonth?.filter((o) => o.status === "cancelado").length || 0;

  const avgTicket = ordersCountThisMonth > 0 ? revenueThisMonth / ordersCountThisMonth : 0;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get last 7 days revenue data
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const { data: dayOrders } = await supabase
      .from("pedidos")
      .select("*")
      .gte("created_at", dayStart.toISOString())
      .lt("created_at", dayEnd.toISOString());

    const dayRevenue = dayOrders?.reduce((sum, o) => sum + o.total, 0) || 0;
    last7DaysData.push({
      date: date.toISOString().split("T")[0],
      revenue: dayRevenue,
      label: date.toLocaleDateString("pt-BR", { weekday: "short" }),
    });
  }

  // Get monthly revenue for last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const { data: monthOrders } = await supabase
      .from("pedidos")
      .select("*")
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", monthEnd.toISOString());

    const monthRevenue = monthOrders?.reduce((sum, o) => sum + o.total, 0) || 0;
    monthlyData.push({
      label: date.toLocaleDateString("pt-BR", { month: "short" }),
      revenue: monthRevenue,
    });
  }

  // Get active clients (clients who ordered this month)
  const activeClientsIds = new Set(ordersThisMonth?.map((o) => o.cliente_id) || []);
  const activeClients = activeClientsIds.size;

  // Get top products
  const productSales: Record<
    string,
    { id: string; nome: string; categoria: string; imagem?: string; quantidade: number; receita: number }
  > = {};

  ordersThisMonth?.forEach((order) => {
    const itens = order.itens || [];
    itens.forEach((item: any) => {
      const produto = item.produto;
      if (produto && produto.id) {
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
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5);

  // Get recent customers with their stats
  const { data: recentClients } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(4);

  const recentCustomers = await Promise.all(
    (recentClients || []).map(async (cliente) => {
      const { data: clientOrders } = await supabase
        .from("pedidos")
        .select("*")
        .eq("cliente_id", cliente.id);

      const totalPedidos = clientOrders?.length || 0;
      const totalGasto = clientOrders?.reduce((sum, o) => sum + o.total, 0) || 0;
      const ultimoPedido = clientOrders?.[0]?.created_at
        ? new Date(clientOrders[0].created_at)
        : new Date();

      let tipo: "novo" | "recorrente" | "vip" = "novo";
      if (totalPedidos >= 10 || totalGasto >= 500) {
        tipo = "vip";
      } else if (totalPedidos >= 3) {
        tipo = "recorrente";
      }

      return {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email || "",
        totalPedidos,
        totalGasto,
        ultimoPedido,
        tipo,
      };
    })
  );

  // Get payment methods distribution
  const paymentMethods: Record<string, { count: number; total: number }> = {};
  ordersThisMonth?.forEach((order) => {
    const method = order.meio_pagamento || "outro";
    if (!paymentMethods[method]) {
      paymentMethods[method] = { count: 0, total: 0 };
    }
    paymentMethods[method].count++;
    paymentMethods[method].total += order.total;
  });

  const totalPayments = Object.values(paymentMethods).reduce((sum, m) => sum + m.total, 0);
  const paymentMethodsData = Object.entries(paymentMethods).map(([name, data]) => ({
    name,
    value: data.total,
    percentage: totalPayments > 0 ? Math.round((data.total / totalPayments) * 100) : 0,
  }));

  // Get hourly orders distribution
  const hourlyOrders: Record<string, number> = {};
  for (let i = 0; i < 24; i++) {
    hourlyOrders[i] = 0;
  }

  ordersThisMonth?.forEach((order) => {
    const hour = new Date(order.created_at).getHours();
    hourlyOrders[hour]++;
  });

  const hourlyData = Object.entries(hourlyOrders)
    .filter(([hour]) => parseInt(hour) >= 8 && parseInt(hour) <= 23)
    .map(([hour, count]) => ({
      hora: `${hour.padStart(2, "0")}h`,
      pedidos: count,
    }));

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentOrdersData = (recentOrders || []).map((order) => ({
    id: order.id,
    cliente: order.cliente_nome || "Cliente",
    endereco: order.endereco_completo?.logradouro || "Endereço não informado",
    pagamento: order.meio_pagamento || "Não informado",
    status: order.status,
    tempo: new Date(order.created_at),
    valor: order.total,
  }));

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
