import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/integrations/supabase/client.server";

/**
 * GET /api/imagem?path=Produtos/acai.webp
 *
 * Gera uma signed URL para um path no bucket privado.
 * O Service Role Key NUNCA sai do servidor.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path || typeof path !== "string" || path.includes("..")) {
    return NextResponse.json({ error: "Path inválido." }, { status: 400 });
  }

  const signedUrl = await getSignedUrl(path);

  if (!signedUrl) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  // Cache por 55 minutos (signed URL dura 1h, damos margem de segurança)
  return NextResponse.json(
    { url: signedUrl },
    {
      headers: {
        "Cache-Control": "private, max-age=3300",
      },
    },
  );
}
