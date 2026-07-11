export function CatalogSkeleton() {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#F7F8FC] animate-pulse">
      <div className="h-16 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between">
        <div className="h-7 w-32 rounded-lg bg-[#E5E7EB]" />
        <div className="flex gap-2">
          <div className="h-9 w-48 rounded-lg bg-[#F3F4F6]" />
          <div className="h-9 w-28 rounded-lg bg-[#F3F4F6]" />
          <div className="h-9 w-36 rounded-lg bg-[#E5E7EB]" />
        </div>
      </div>
      <div className="h-12 border-b border-[#E5E7EB] bg-white px-6 flex gap-6 items-end">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-20 mb-3 rounded bg-[#F3F4F6]" />
        ))}
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-[260px] border-r border-[#E5E7EB] bg-white p-3 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-[#F3F4F6]" />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-3">
          <div className="h-8 w-48 rounded bg-[#E5E7EB]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-[#E5E7EB] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
