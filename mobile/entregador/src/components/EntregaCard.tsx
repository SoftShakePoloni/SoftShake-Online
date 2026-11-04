import { memo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Botao } from "./Botao";
import { font, radius, useTheme } from "../theme";
import {
  formatarEndereco,
  formatarTelefone,
  horaSaida,
  linkTelefone,
  resumoPagamento,
  type Entrega,
  type ErroApp,
} from "../lib/entregas";

type Props = {
  entrega: Entrega;
  agora: number;
  onConcluir: (id: string) => Promise<{ ok: true } | { ok: false; erro: ErroApp }>;
  onConcluida: () => void;
};

function Rotulo({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={[styles.rotulo, { color: t.subtle }]}>{children}</Text>;
}

export const EntregaCard = memo(function EntregaCard({ entrega, agora, onConcluir, onConcluida }: Props) {
  const t = useTheme();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const end = formatarEndereco(entrega.endereco);
  const pag = resumoPagamento(entrega);
  const tel = linkTelefone(entrega.cliente_telefone);

  const concluir = () => {
    if (enviando) return;
    Alert.alert(
      "Confirmar entrega?",
      `Pedido #${entrega.numero} · ${entrega.cliente_nome}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Entregue",
          onPress: async () => {
            setEnviando(true); // segura toques repetidos até o servidor responder
            setErro(null);
            const r = await onConcluir(entrega.id);
            if (r.ok) {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              onConcluida();
            } else {
              setErro(r.erro.mensagem);
              setEnviando(false);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.topo}>
        <Text style={[styles.numero, { color: t.brand }]}>#{entrega.numero}</Text>
        <Text style={[styles.hora, { color: t.muted }]}>{horaSaida(entrega.saiu_entrega_at, agora)}</Text>
      </View>

      <Text style={[styles.cliente, { color: t.text }]} numberOfLines={2}>
        {entrega.cliente_nome}
      </Text>

      <View style={styles.bloco}>
        <Rotulo>ENDEREÇO</Rotulo>
        <Text style={[styles.endereco, { color: t.text }]} selectable>
          {end.linha1}
        </Text>
        {!!end.linha2 && <Text style={[styles.texto, { color: t.muted }]}>{end.linha2}</Text>}
        {!!end.complemento && <Text style={[styles.texto, { color: t.text }]}>Complemento: {end.complemento}</Text>}
        {!!end.referencia && <Text style={[styles.texto, { color: t.text }]}>Referência: {end.referencia}</Text>}
      </View>

      {!!entrega.cliente_telefone && (
        <Pressable
          disabled={!tel}
          onPress={() => tel && void Linking.openURL(tel)}
          accessibilityRole="link"
          accessibilityLabel={`Ligar para ${entrega.cliente_nome}`}
          style={({ pressed }) => [styles.telefone, { borderColor: t.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.texto, { color: t.muted }]}>Telefone</Text>
          <Text style={[styles.telefoneNumero, { color: t.brand }]}>{formatarTelefone(entrega.cliente_telefone)}</Text>
        </Pressable>
      )}

      <View style={[styles.pagamento, { backgroundColor: pag.levarTroco ? t.warnSoft : t.brandSoft }]}>
        <View style={styles.pagLinha}>
          <Text style={[styles.pagForma, { color: t.text }]}>{pag.forma}</Text>
          <Text style={[styles.pagValor, { color: t.text }]}>{pag.valor}</Text>
        </View>
        {!!pag.troco && (
          <Text style={[styles.texto, { color: pag.levarTroco ? t.warn : t.muted, fontFamily: pag.levarTroco ? font.semibold : font.regular }]}>
            {pag.troco}
          </Text>
        )}
      </View>

      {entrega.itens.length > 0 && (
        <View style={styles.bloco}>
          <Rotulo>PEDIDO</Rotulo>
          {entrega.itens.map((item, i) => (
            <Text key={i} style={[styles.texto, { color: t.text }]}>
              <Text style={{ fontFamily: font.semibold }}>{item.qtd}× </Text>
              {item.nome}
              {item.obs ? <Text style={{ color: t.muted }}> — {item.obs}</Text> : null}
            </Text>
          ))}
        </View>
      )}

      {!!entrega.observacoes && (
        <View style={[styles.obs, { backgroundColor: t.warnSoft }]}>
          <Rotulo>OBSERVAÇÕES</Rotulo>
          <Text style={[styles.texto, { color: t.text }]}>{entrega.observacoes}</Text>
        </View>
      )}

      {!!erro && (
        <Text style={[styles.erro, { color: t.danger, backgroundColor: t.dangerSoft }]} accessibilityRole="alert">
          {erro}
        </Text>
      )}

      <Botao
        titulo="Marcar como entregue"
        onPress={concluir}
        carregando={enviando}
        accessibilityHint="Pede confirmação e conclui a entrega"
        style={{ marginTop: 4 }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 14 },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  numero: { fontFamily: font.bold, fontSize: 15, letterSpacing: 0.4 },
  hora: { fontFamily: font.medium, fontSize: 13 },
  cliente: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26, marginTop: -6 },
  bloco: { gap: 3 },
  rotulo: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.8, marginBottom: 2 },
  endereco: { fontFamily: font.medium, fontSize: 16, lineHeight: 23 },
  texto: { fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  telefone: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    minHeight: 48,
  },
  telefoneNumero: { fontFamily: font.semibold, fontSize: 16 },
  pagamento: { borderRadius: 12, padding: 14, gap: 4 },
  pagLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  pagForma: { fontFamily: font.semibold, fontSize: 15 },
  pagValor: { fontFamily: font.bold, fontSize: 18 },
  obs: { borderRadius: 12, padding: 12, gap: 2 },
  erro: { fontFamily: font.medium, fontSize: 14, borderRadius: 10, padding: 10 },
});
