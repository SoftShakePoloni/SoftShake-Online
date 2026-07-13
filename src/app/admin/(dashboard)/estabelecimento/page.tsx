import { ensureConfiguracoesLoja } from "@/actions/admin/configuracoes";
import { EstabelecimentoManager } from "@/components/admin/estabelecimento";
import {
  normalizeConfiguracao,
  type ConfiguracaoLoja,
} from "@/types/configuracoes";

export const metadata = {
  title: "Estabelecimento | SoftShake Admin",
  description: "Edite os dados da sua loja",
};

export default async function EstabelecimentoPage() {
  let raw: Record<string, unknown> | null = null;

  try {
    raw = (await ensureConfiguracoesLoja()) as Record<string, unknown> | null;
  } catch (error) {
    console.error("Erro ao carregar configurações da loja:", error);
  }

  const configuracao: ConfiguracaoLoja = raw
    ? normalizeConfiguracao(raw)
    : normalizeConfiguracao({
        id: 0,
        nome: "SoftShake",
        descricao: "Sua loja de açaí e milk shake",
        esta_aberto: true,
        taxa_entrega: 5,
        pedido_minimo: 20,
        tempo_entrega_min: 30,
        tempo_entrega_max: 45,
      });

  return <EstabelecimentoManager configuracaoInicial={configuracao} />;
}
