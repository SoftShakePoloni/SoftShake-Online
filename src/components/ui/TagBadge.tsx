import type { Tag } from "@/data/tipos";
import {readableTagForeground} from "@/lib/accessibility/contrast";
import {
  BadgePercent,
  Crown,
  Flame,
  Sparkles,
  Tag as TagIcon,
} from "lucide-react";

export function TagBadge({ tag }: { tag: Tag }) {
  const nome = tag.nome.toLocaleLowerCase("pt-BR");
  const Icon =
    nome.includes("cashback") || nome.includes("promo")
      ? BadgePercent
      : nome.includes("mais pedido") || nome.includes("mais vendido")
        ? Flame
        : nome.includes("premium")
          ? Crown
          : nome.includes("novidade") || nome.includes("recomendado")
            ? Sparkles
            : TagIcon;

  return (
    <span
      className="inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold leading-none"
      style={{ backgroundColor: tag.cor_fundo, color: readableTagForeground(tag.cor_fundo,tag.cor_texto) }}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={2.4} />
      {tag.nome}
    </span>
  );
}
