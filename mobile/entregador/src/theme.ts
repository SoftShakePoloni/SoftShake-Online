import { useColorScheme } from "react-native";

/** Cores da marca SoftShake (roxo do painel) em claro e escuro. */
const light = {
  bg: "#F6F4F9",
  card: "#FFFFFF",
  border: "#ECE7F2",
  text: "#18121F",
  muted: "#6E6679",
  subtle: "#9A93A4",
  brand: "#4C258C",
  brandPressed: "#3C1D70",
  brandSoft: "#F1ECF9",
  onBrand: "#FFFFFF",
  success: "#0E7A4E",
  successSoft: "#E7F6EF",
  warn: "#8A4B00",
  warnSoft: "#FFF5E6",
  danger: "#B42318",
  dangerSoft: "#FEF3F2",
  input: "#FFFFFF",
};

const dark: typeof light = {
  bg: "#0E0A13",
  card: "#18121F",
  border: "#2A2233",
  text: "#F4F0F8",
  muted: "#B3AABD",
  subtle: "#7E7589",
  brand: "#8C63D6",
  brandPressed: "#7A50C7",
  brandSoft: "#251A35",
  onBrand: "#FFFFFF",
  success: "#4CC38A",
  successSoft: "#12261D",
  warn: "#F2B35B",
  warnSoft: "#2A1F10",
  danger: "#F97066",
  dangerSoft: "#2B1513",
  input: "#211A2A",
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const radius = { card: 18, button: 14, input: 12, pill: 999 };
