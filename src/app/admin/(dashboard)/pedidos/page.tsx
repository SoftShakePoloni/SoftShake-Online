import { listPedidosAdmin } from "@/actions/admin/pedidos";
import { PedidosManager } from "@/components/admin/pedidos/PedidosManager";

export default async function AdminOrdersPage() {
  let orders: any[] = [];

  try {
    orders = await listPedidosAdmin(100);
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
  }

  return <PedidosManager pedidosIniciais={orders} />;
}
