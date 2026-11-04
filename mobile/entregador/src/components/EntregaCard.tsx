import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { font, radius, useTheme } from "../theme";
import { formatarEndereco, horaSaida, resumoPagamento, type Entrega } from "../lib/entregas";

/** Card compacto: só o básico. Tocar abre os detalhes (onde se marca a entrega). */
export const EntregaCard = memo(function EntregaCard({
  entrega,
  agora,
  onAbrir,
}: {
  entrega: Entrega;
  agora: number;
  onAbrir: (id: string) => void;
}) {
  const t = useTheme();
  const end = formatarEndereco(entrega.endereco);
  const pag = resumoPagamento(entrega);

  return (
    <Pressable
      onPress={() => onAbrir(entrega.id)}
      accessibilityRole="button"
      accessibilityLabel={`Pedido ${entrega.numero}, ${entrega.cliente_nome}, ${end.linha1}`}
      accessibilityHint="Abre os detalhes da entrega"
      style={({ pressed }) => [
        styles.card,
        { borderColor: t.border, backgroundColor: pressed ? t.brandSoft : t.card },
      ]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.topo}>
          <Text style={[styles.numero, { color: t.brand }]}>#{entrega.numero}</Text>
          <Text style={[styles.hora, { color: t.muted }]} numberOfLines={1}>
            {horaSaida(entrega.saiu_entrega_at, agora)}
          </Text>
        </View>
        <Text style={[styles.cliente, { color: t.text }]} numberOfLines={1}>
          {entrega.cliente_nome}
        </Text>
        <Text style={[styles.endereco, { color: t.muted }]} numberOfLines={1}>
          {end.linha1}
        </Text>
        <View style={styles.chips}>
          <Text style={[styles.chip, { color: t.text, backgroundColor: t.brandSoft }]}>
            {pag.forma} · {pag.valor}
          </Text>
          {pag.valorTroco ? (
            <Text style={[styles.chip, { color: t.warn, backgroundColor: t.warnSoft, fontFamily: font.semibold }]}>
              Troco {pag.valorTroco}
            </Text>
          ) : null}
        </View>
      </View>
      <ChevronRight color={t.subtle} size={20} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
  },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  numero: { fontFamily: font.semibold, fontSize: 13, letterSpacing: 0.3 },
  hora: { fontFamily: font.regular, fontSize: 12, flexShrink: 1 },
  cliente: { fontFamily: font.semibold, fontSize: 16 },
  endereco: { fontFamily: font.regular, fontSize: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 5 },
  chip: { fontFamily: font.medium, fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
});
