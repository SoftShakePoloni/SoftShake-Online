import { listPedidosAdmin } from "@/actions/admin/pedidos";
import { PedidosManager } from "@/components/admin/pedidos/PedidosManager";
import type { PedidoRow } from "@/hooks/usePedidosRealtime";

export default async function AdminOrdersPage() {
  let orders: PedidoRow[] = [];

  try {
    orders = (await listPedidosAdmin(100)) as PedidoRow[];
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
  }

  return <PedidosManager pedidosIniciais={orders} />;
}
