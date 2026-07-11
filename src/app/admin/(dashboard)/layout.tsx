import { requireAdmin } from "@/lib/admin/auth";
import { PremiumSidebar } from "@/components/admin/premium/PremiumSidebar";
import { PremiumTopbar } from "@/components/admin/premium/PremiumTopbar";

/**
 * Shell do admin. Auth é checado aqui (e no middleware).
 * Config da loja NÃO é buscada no layout — o StoreStatusCard carrega no cliente
 * (com realtime), evitando um round-trip extra em toda navegação da sidebar.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = await requireAdmin();
  const adminEmail = admin.email || "";
  const adminName = admin.nome || adminEmail.split("@")[0] || "Admin";

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <div className="flex">
        <PremiumSidebar adminEmail={adminEmail} />
        <main className="flex-1 min-h-screen flex flex-col ml-[270px]">
          <PremiumTopbar adminName={adminName} adminEmail={adminEmail} />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
