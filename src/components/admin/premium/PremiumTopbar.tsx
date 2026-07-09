"use client";

import { Search, Plus, Bell, HelpCircle, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PremiumTopbarProps {
  adminName: string;
  adminEmail: string;
}

export function PremiumTopbar({ adminName, adminEmail }: PremiumTopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const currentDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
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
      className="sticky top-0 z-40 h-20 bg-white border-b border-[#E5E7EB] flex items-center px-8"
    >
      <div className="flex-1 flex items-center gap-8">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Buscar pedidos, clientes, produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-[#F7F8FC] border border-transparent rounded-xl text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#4C258C] focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        {/* Date */}
        <div className="hidden lg:flex items-center gap-2 text-sm text-[#6B7280]">
          <Calendar className="w-4 h-4" />
          <span className="capitalize">{currentDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* New Sale Button */}
        <button className="h-11 px-6 bg-[#4C258C] hover:bg-[#5E35B1] text-white font-medium rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nova Venda</span>
        </button>

        {/* Notifications */}
        <button className="relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-[#F7F8FC] text-[#6B7280] hover:text-[#111827] transition-all duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
        </button>

        {/* Help */}
        <button className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-[#F7F8FC] text-[#6B7280] hover:text-[#111827] transition-all duration-200">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4C258C] to-[#7C3AED] flex items-center justify-center cursor-pointer ring-2 ring-transparent hover:ring-[#EEE8FA] transition-all duration-200">
          <span className="text-white font-semibold text-sm">
            {adminName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
