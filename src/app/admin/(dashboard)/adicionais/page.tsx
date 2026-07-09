import { requireAdmin } from "@/lib/admin/auth";
import { AdicionaisManager } from "@/components/admin/adicionais/AdicionaisManager";

export default async function AdicionaisPage() {
  await requireAdmin();
  
  return <AdicionaisManager />;
}
