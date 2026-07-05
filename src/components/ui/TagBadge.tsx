import type { Tag } from "@/data/tipos";

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className="inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
      style={{ backgroundColor: tag.cor_fundo, color: tag.cor_texto }}
    >
      {tag.nome}
    </span>
  );
}
