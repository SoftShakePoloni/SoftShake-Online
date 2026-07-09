import { requireAdmin } from "@/lib/admin/auth";
import { RelatoriosManager } from "@/components/admin/relatorios/RelatoriosManager";

export const metadata = {
  title: "Relatórios | SoftShake Admin",
  description: "Relatórios e indicadores de desempenho da loja",
};

export default async function AdminReportsPage() {
  await requireAdmin();

  return <RelatoriosManager />;
}
