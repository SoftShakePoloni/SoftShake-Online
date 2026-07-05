import type { Metadata } from "next";
import PaginaPromocoes from "@/components/paginas/PaginaPromocoes";

export const metadata: Metadata = {
  title: "Promoções — SoftShake",
  description: "Confira as promoções da semana no SoftShake.",
};

export default function Promocoes() {
  return <PaginaPromocoes />;
}
