import "server-only";
import { createServerClient } from "@/integrations/supabase/client.server";
import { imageProxyUrl } from "@/lib/image/proxy-url";

export async function fetchLojaResumo() {
  const { data, error } = await createServerClient()
    .from("configuracoes_loja")
    .select(
      "id,nome,logo_url,banner_url,cidade,estado,horario_abertura,taxa_entrega,tempo_entrega_min,tempo_entrega_max,esta_aberto",
    )
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    logo_url: imageProxyUrl(data.logo_url),
    banner_url: imageProxyUrl(data.banner_url),
  };
}
