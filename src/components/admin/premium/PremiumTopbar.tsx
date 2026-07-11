"use client";

import { Bell, Calendar } from "lucide-react";
import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PremiumTopbarProps {
  adminName: string;
  adminEmail?: string;
}

export function PremiumTopbar({ adminName }: PremiumTopbarProps) {
  const currentDate = format(new Date(), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  useEffect(() => {
    if (!adminName) return;
    try {
      localStorage.setItem("softshake-admin-name", adminName);
    } catch {
      // ignore
    }
  }, [adminName]);

  return (
    <header
      data-admin-name={adminName}
      className="sticky top-0 z-40 h-14 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between px-8"
    >
      {/* Left — data atual */}
      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
        <Calendar className="w-4 h-4 text-[#4C258C]/70" />
        <span className="capitalize">{currentDate}</span>
      </div>

      {/* Right — notificações */}
      <button
        type="button"
        aria-label="Notificações"
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F7F8FC] text-[#6B7280] hover:text-[#111827] transition-colors duration-200"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
      </button>
    </header>
  );
}
