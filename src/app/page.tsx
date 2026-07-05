import type { Metadata } from "next";
import PaginaInicio from "@/components/paginas/PaginaInicio";

export const metadata: Metadata = {
  title: "SoftShake — Delivery online",
  description: "Peça seu milkshake online no SoftShake. Escolha seu sabor favorito com entrega em Poloni - SP.",
};

export default function Home() {
  return <PaginaInicio />;
}
