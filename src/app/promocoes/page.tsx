import { permanentRedirect } from "next/navigation";

// A página de promoções foi removida: as ofertas ficam em destaque no cardápio.
export default function Promocoes() {
  permanentRedirect("/?categoria=ofertas-promocoes");
}
