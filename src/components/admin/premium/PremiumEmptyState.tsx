"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "purple";
}

export function PremiumEmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
}: PremiumEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
          variant === "purple" ? "bg-[#EEE8FA]" : "bg-gray-100"
        )}
      >
        <Icon
          className={cn(
            "w-8 h-8",
            variant === "purple" ? "text-[#4C258C]" : "text-gray-400"
          )}
        />
      </div>
      <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="h-11 px-6 bg-[#4C258C] hover:bg-[#5E35B1] text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
