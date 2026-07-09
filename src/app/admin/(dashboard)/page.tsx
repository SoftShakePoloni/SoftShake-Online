import { getDashboardData } from "@/actions/admin/dashboard";
import {
  PremiumStatCard,
  PremiumRevenueChart,
  PremiumDonutChart,
  PremiumOrdersTable,
  PremiumActivityFeed,
  PremiumFinancialSummary,
  PremiumTopProducts,
  PremiumHourlyChart,
  PremiumPaymentMethods,
  PremiumRecentCustomers,
} from "@/components/admin/premium";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  // Dados para o gráfico de status
  const statusData = [
    { name: "Pagos", value: data.orders.paid, color: "#22C55E" },
    { name: "Pendentes", value: data.orders.pending, color: "#F59E0B" },
    { name: "Cancelados", value: data.orders.cancelled, color: "#EF4444" },
  ];

  // Sparkline data para os cards
  const revenueSparkline = data.last7DaysData.map((d) => d.revenue);
  const ordersSparkline = [32, 38, 35, 42, 48, 45, 52]; // Será calculado dos dados reais

  // Dados financeiros
  const financialData = {
    entradas: data.revenue.total,
    saidas: data.revenue.total * 0.25,
    lucro: data.revenue.total * 0.75,
    taxas: data.revenue.total * 0.08,
    cancelados: data.orders.cancelled * 50,
  };

  return (
    <div className="p-8">
      <div className="space-y-8 max-w-[1800px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
          Dashboard
        </h1>
        <p className="text-[#6B7280] mt-2">
          Acompanhe em tempo real o desempenho do seu delivery.
        </p>
      </div>

      {/* Primary Stats - 4 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <PremiumStatCard
          title="Receita do Mês"
          value={`R$ ${data.revenue.total.toFixed(2).replace(".", ",")}`}
          icon="DollarSign"
          trend={data.revenue.change}
          trendLabel="vs mês anterior"
          variant="purple"
          sparklineData={revenueSparkline}
        />
        <PremiumStatCard
          title="Pedidos"
          value={data.orders.total}
          icon="ShoppingBag"
          trend={data.orders.change}
          trendLabel="vs mês anterior"
          variant="blue"
          sparklineData={ordersSparkline}
        />
        <PremiumStatCard
          title="Clientes"
          value={data.clients.total}
          icon="Users"
          subtitle={`${data.clients.active} ativos este mês`}
          variant="green"
        />
        <PremiumStatCard
          title="Ticket Médio"
          value={`R$ ${data.avgTicket.toFixed(2).replace(".", ",")}`}
          icon="Target"
          variant="orange"
        />
      </div>

      {/* Main Content Grid - 3 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="xl:col-span-2">
          <PremiumRevenueChart
            data={data.monthlyData as any}
            title="Evolução da Receita"
            description="Receita mensal dos últimos 6 meses"
          />
        </div>

        {/* Financial Summary - Takes 1 column */}
        <PremiumFinancialSummary data={financialData} />
      </div>

      {/* Charts Row - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PremiumHourlyChart data={data.hourlyData} />
        <PremiumPaymentMethods methods={data.paymentMethodsData} />
      </div>

      {/* Products and Customers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PremiumTopProducts products={data.topProducts} />
        <PremiumRecentCustomers customers={data.recentCustomers} />
      </div>

      {/* Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PremiumDonutChart
          data={statusData}
          title="Status dos Pedidos"
          description="Distribuição por status de pagamento"
        />
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            Métricas Rápidas
          </h3>
          <p className="text-sm text-[#6B7280] mb-6">
            Indicadores de desempenho
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#F7F8FC] rounded-xl">
              <span className="text-sm font-medium text-[#111827]">
                Taxa de Conversão
              </span>
              <span className="text-lg font-bold text-[#4C258C]">
                {((data.orders.paid / data.orders.total) * 100 || 0).toFixed(
                  1
                )}
                %
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F8FC] rounded-xl">
              <span className="text-sm font-medium text-[#111827]">
                Receita Hoje
              </span>
              <span className="text-lg font-bold text-emerald-600">
                R$ {data.revenue.today.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F8FC] rounded-xl">
              <span className="text-sm font-medium text-[#111827]">
                Clientes Ativos
              </span>
              <span className="text-lg font-bold text-blue-600">
                {data.clients.active}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F8FC] rounded-xl">
              <span className="text-sm font-medium text-[#111827]">
                Pedidos Cancelados
              </span>
              <span className="text-lg font-bold text-red-600">
                {data.orders.cancelled}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Table and Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Latest Orders - Takes 2 columns */}
        <div className="xl:col-span-2">
          <PremiumOrdersTable orders={data.recentOrders} />
        </div>

        {/* Activity Feed - Takes 1 column */}
        <PremiumActivityFeed />
      </div>
    </div>
  </div>
  );
}

