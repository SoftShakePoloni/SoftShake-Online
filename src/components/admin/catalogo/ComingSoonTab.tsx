"use client";

import { CatalogEmpty } from "./CatalogEmpty";

export function ComingSoonTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#F7F8FC] p-8">
      <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
        <CatalogEmpty kind="coming" />
        <div className="px-8 pb-8 -mt-8 text-center">
          <h3 className="text-base font-bold text-[#111827] mb-1">{title}</h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
