import { requireAdmin } from "@/lib/admin/auth";
import { TicketPercent, Construction, Sparkles } from "lucide-react";

export const metadata = {
  title: "Cupons | SoftShake Admin",
  description: "Gerenciamento de cupons e promoções",
};

export default async function CuponsPage() {
  await requireAdmin();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 sm:p-8 bg-[#F7F8FC]">
      <div className="max-w-lg w-full text-center bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-10 sm:p-12">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#F3EEFA] flex items-center justify-center">
          <TicketPercent className="w-8 h-8 text-[#4C258C]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-4">
          <Construction className="w-3.5 h-3.5" />
          Em desenvolvimento
        </div>
        <h1 className="text-xl font-bold text-[#111827] mb-2">Cupons</h1>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
          Em breve você poderá criar e gerenciar cupons de desconto, campanhas e
          códigos promocionais por aqui — com regras de uso, validade e limites.
        </p>
        <ul className="text-left text-sm text-[#6B7280] space-y-2.5 max-w-sm mx-auto">
          {[
            "Cupons percentuais e de valor fixo",
            "Validade e limite de usos",
            "Campanhas por categoria ou produto",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#4C258C] shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
