/**
 * Visual do app: branco, com o roxo da marca e os mesmos tons da tela de pedido
 * do cardápio (DetalhePedidoView). Sem modo escuro, por escolha da loja.
 */
const cores = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E7E1EB",
  text: "#21172D",
  muted: "#7B668C",
  subtle: "#A99DB3",
  brand: "#4C258C",
  brandPressed: "#3C1D70",
  brandSoft: "#F4EFFA",
  onBrand: "#FFFFFF",
  success: "#0E7A4E",
  successSoft: "#E7F6EF",
  warn: "#8A4B00",
  warnSoft: "#FFF5E6",
  danger: "#B42318",
  dangerSoft: "#FEF3F2",
  input: "#FFFFFF",
};

export type Theme = typeof cores;

export function useTheme(): Theme {
  return cores;
}

export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const radius = { card: 16, button: 14, input: 12, pill: 999 };
