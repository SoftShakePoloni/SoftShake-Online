import { NextRequest, NextResponse } from "next/server";
import {imageCacheControl} from "@/lib/image/cache-policy";
import { readStorageImage } from "@/lib/image/source.server";
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

    const source = await readStorageImage(bucket, path);
    if (!source) return apiError("Imagem não encontrada.", 404, { codigo: "NOT_FOUND" });
    const { bytes, etag } = source;
    const cacheHeaders={'ETag':etag,'Cache-Control':imageCacheControl(path)};
    if(request.headers.get('if-none-match')?.split(',').some(value=>value.trim().replace(/^W\//,'')===etag))return new NextResponse(null,{status:304,headers:cacheHeaders});
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": source.type,
        "Content-Length": String(bytes.byteLength),
        ...cacheHeaders,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
);
