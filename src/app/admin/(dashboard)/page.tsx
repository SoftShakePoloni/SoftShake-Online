import { getDashboardData } from "@/actions/admin/dashboard";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";

export const metadata = {
  title: "Dashboard | SoftShake Admin",
  description: "Visão geral do estabelecimento",
};

export default async function AdminDashboardPage() {
  const data = await getDashboardData("hoje");

  return <DashboardView initialData={data} />;
}
