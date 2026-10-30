import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/client.server";
import { withApiGuard } from "@/lib/security/with-api-guard";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { apiError, apiValidation } from "@/lib/security/api-response";
import { isAllowedImagePath, sanitizeStoragePath } from "@/lib/security/sanitize";

/** Transmite a imagem pelo servidor sem expor URL assinada do Storage. */
export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.imagem, checkOrigin: false },
  async (request: NextRequest) => {
    const path = sanitizeStoragePath(request.nextUrl.searchParams.get("path"));
    const bucket = request.nextUrl.searchParams.get("bucket") || "SoftShake Images";
    if (!path || !isAllowedImagePath(path) || !["SoftShake Images", "images"].includes(bucket)) {
      return apiValidation("Path inválido.");
    }

    const { data, error } = await createServerClient().storage.from(bucket).download(path);
    if (error || !data) return apiError("Imagem não encontrada.", 404, { codigo: "NOT_FOUND" });

    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
);
