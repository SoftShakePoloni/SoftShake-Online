import { createServiceRoleClient } from "@/integrations/supabase/client.server";
import { getSaoPauloDateTime } from "@/lib/promocoes/frete";

export type CupomPublico = {
  codigo: string;
  nome: string;
  tipo: "percentual" | "valor_fixo";
  valor: number;
  valor_minimo: number;
  desconto: number;
};

export async function validarCupom(codigoEntrada: string, subtotal: number) {
  const codigo = codigoEntrada.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(codigo) || !Number.isFinite(subtotal) || subtotal < 0) {
    throw new Error("Cupom inválido.");
  }

  const { data, error } = await createServiceRoleClient()
    .from("cupons")
    .select("codigo, nome, tipo, valor, valor_minimo, limite_usos, usos, data_inicio, data_fim, ativo")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) throw new Error("Não foi possível validar o cupom agora.");
  if (!data || !data.ativo) throw new Error("Esse cupom não é válido.");

  const hoje = getSaoPauloDateTime().date;
  if (hoje < data.data_inicio || (data.data_fim && hoje > data.data_fim)) {
    throw new Error("Esse cupom está fora do período de validade.");
  }
  if (data.limite_usos != null && data.usos >= data.limite_usos) {
    throw new Error("Esse cupom já atingiu o limite de utilizações.");
  }
  if (subtotal < Number(data.valor_minimo)) {
    throw new Error(`O pedido mínimo para este cupom é R$ ${Number(data.valor_minimo).toFixed(2).replace(".", ",")}.`);
  }

  const desconto = Math.min(
    subtotal,
    data.tipo === "percentual"
      ? Math.round(subtotal * Number(data.valor)) / 100
      : Number(data.valor)
  );

  return {
    codigo: data.codigo,
    nome: data.nome,
    tipo: data.tipo as CupomPublico["tipo"],
    valor: Number(data.valor),
    valor_minimo: Number(data.valor_minimo),
    desconto: Math.round(desconto * 100) / 100,
  } satisfies CupomPublico;
}
