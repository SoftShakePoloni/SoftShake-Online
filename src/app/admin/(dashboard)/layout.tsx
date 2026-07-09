import { requireAdmin } from "@/lib/admin/auth";
import { PremiumSidebar } from "@/components/admin/premium/PremiumSidebar";
import { PremiumTopbar } from "@/components/admin/premium/PremiumTopbar";
import { usePathname } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require admin authentication
  const { admin } = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <div className="flex">
        <PremiumSidebar adminEmail={(admin as any).email} />
        <main className="flex-1 min-h-screen flex flex-col ml-[270px]">
          <PremiumTopbar 
            adminName={(admin as any).nome || (admin as any).email?.split('@')[0]} 
            adminEmail={(admin as any).email}
          />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
