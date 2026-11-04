import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Botao } from "../components/Botao";
import { EntregaCard } from "../components/EntregaCard";
import { EstadoVazio } from "../components/EstadoVazio";
import { EntregaDetalhe } from "./EntregaDetalhe";
import { useEntregas } from "../hooks/useEntregas";
import type { Perfil } from "../hooks/useAuth";
import { font, radius, useTheme } from "../theme";

if (Platform.OS === "android") UIManager.setLayoutAnimationEnabledExperimental?.(true);

export function EntregasScreen({
  perfil,
  onSair,
  onAcessoNegado,
}: {
  perfil: Perfil;
  onSair: () => void;
  onAcessoNegado: (mensagem: string) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { entregas, carregando, atualizando, erro, conexao, atualizar, concluir } = useEntregas(perfil.id, onAcessoNegado);
  const [agora, setAgora] = useState(Date.now());
  const aviso = useRef(new Animated.Value(0)).current;
  const [aberta, setAberta] = useState<string | null>(null);
  const [textoAviso, setTextoAviso] = useState("Entrega concluída");
  const concluidaAgora = useRef<string | null>(null);
  const entregaAberta = aberta ? (entregas.find((e) => e.id === aberta) ?? null) : null;

  // "há X min" no card: atualiza a cada minuto, sem buscar nada no servidor.
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const mostrarAviso = useCallback((texto: string) => {
    setTextoAviso(texto);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    aviso.setValue(0);
    Animated.sequence([
      Animated.timing(aviso, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(aviso, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [aviso]);

  const concluirAberta = useCallback(
    async (id: string) => {
      concluidaAgora.current = id;
      const r = await concluir(id);
      if (!r.ok) concluidaAgora.current = null;
      return r;
    },
    [concluir],
  );

  // O pedido aberto saiu da lista: concluído aqui (aviso de sucesso) ou mudado
  // pela loja (cancelado, voltou de status): fecha os detalhes e explica.
  useEffect(() => {
    if (!aberta || carregando || entregaAberta) return;
    const foiAqui = concluidaAgora.current === aberta;
    concluidaAgora.current = null;
    setAberta(null);
    mostrarAviso(foiAqui ? "Entrega concluída" : "Este pedido não está mais com você");
  }, [aberta, carregando, entregaAberta, mostrarAviso]);

  const confirmarSaida = () =>
    Alert.alert("Sair do app?", "Você vai precisar entrar de novo com e-mail e senha.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: onSair },
    ]);

  const primeiroNome = perfil.nome.split(" ")[0];
  const quantidade = entregas.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} accessibilityLabel="SoftShake" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.ola, { color: t.text }]} numberOfLines={1}>
            {primeiroNome ? `Olá, ${primeiroNome}` : "Olá"}
          </Text>
          <Text style={[styles.resumo, { color: t.muted }]}>
            {carregando ? "Carregando…" : quantidade === 0 ? "Nenhuma entrega" : quantidade === 1 ? "1 entrega" : `${quantidade} entregas`}
          </Text>
        </View>
        <Botao titulo="Sair" variante="texto" onPress={confirmarSaida} />
      </View>

      {/* Indicador só quando há problema de conexão. */}
      {conexao === "offline" && (
        <View style={[styles.faixa, { backgroundColor: t.warnSoft }]} accessibilityLiveRegion="polite">
          <Text style={[styles.faixaTexto, { color: t.warn }]}>Sem conexão. Tentando reconectar…</Text>
        </View>
      )}
      {erro && erro.tipo !== "conexao" && (
        <View style={[styles.faixa, { backgroundColor: t.dangerSoft }]}>
          <Text style={[styles.faixaTexto, { color: t.danger }]}>{erro.mensagem}</Text>
        </View>
      )}

      {carregando && quantidade === 0 ? (
        <View style={styles.centro}>
          <ActivityIndicator color={t.brand} />
        </View>
      ) : (
        <FlatList
          data={entregas}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <EntregaCard entrega={item} agora={agora} onAbrir={setAberta} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 24 }, quantidade === 0 && { flexGrow: 1 }]}
          ListEmptyComponent={<EstadoVazio />}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => void atualizar()} tintColor={t.brand} colors={[t.brand]} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            backgroundColor: t.text,
            bottom: insets.bottom + 20,
            opacity: aviso,
            transform: [{ translateY: aviso.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
        accessibilityLiveRegion="polite"
      >
        <Text style={[styles.toastTexto, { color: t.bg }]}>{textoAviso}</Text>
      </Animated.View>

      <EntregaDetalhe
        entrega={entregaAberta}
        agora={agora}
        onFechar={() => setAberta(null)}
        onConcluir={concluirAberta}
        onConcluida={() => {
          /* o card some da lista e o efeito acima fecha os detalhes com o aviso */
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: { width: 40, height: 40, borderRadius: 10 },
  ola: { fontFamily: font.semibold, fontSize: 18 },
  resumo: { fontFamily: font.regular, fontSize: 14, marginTop: 1 },
  faixa: { paddingHorizontal: 20, paddingVertical: 9 },
  faixaTexto: { fontFamily: font.medium, fontSize: 14 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
  lista: { padding: 16 },
  toast: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toastTexto: { fontFamily: font.semibold, fontSize: 15 },
});
