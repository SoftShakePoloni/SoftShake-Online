import { listPedidosAdmin } from "@/actions/admin/pedidos";
import { getStoreSettings } from "@/actions/admin/store-settings";
import { PedidosManager } from "@/components/admin/pedidos/PedidosManager";
import type { PedidoRow } from "@/hooks/usePedidosRealtime";

export default async function AdminOrdersPage() {
  let orders: PedidoRow[] = [];
  let autoAccept = false;

  try {
    const [pedidos, settings] = await Promise.all([
      listPedidosAdmin(150),
      getStoreSettings().catch(() => null),
    ]);
    orders = pedidos as PedidoRow[];
    autoAccept = Boolean(settings?.auto_accept_orders);
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
  }

  return (
    <PedidosManager
      pedidosIniciais={orders}
      autoAcceptInicial={autoAccept}
    />
  );
}
