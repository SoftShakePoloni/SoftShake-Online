export function FreteGratisBadge({ prazo }: { prazo?: string }) {
  return (
    <span
      className="inline-flex w-fit rounded-md bg-[#E8F3EA] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#356344]"
      title={prazo ? `Frete grátis ${prazo}` : "Este produto participa de uma campanha de frete grátis"}
      aria-label={prazo ? `Frete grátis, válido ${prazo}` : "Frete grátis"}
    >
      Frete grátis
    </span>
  );
}
