import { NextRequest, NextResponse } from "next/server";
import { withApiGuard } from "@/lib/security/with-api-guard";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { apiError } from "@/lib/security/api-response";
import {
  backupKey,
  downloadBackup,
  fetchBackupMeta,
  verifyDownloadToken,
} from "@/lib/backups.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Entrega um backup já descriptografado. A autorização é o token de 60 s gerado
 * por getBackupDownloadUrl (que exige admin:manage e grava auditoria): o app
 * Windows abre o link no navegador, que não tem a sessão do painel.
 */
export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.apiStrict, checkOrigin: false },
  async (request: NextRequest) => {
    const key = backupKey();
    if (!key) return apiError("Backup não configurado no servidor.", 503);
    const id = verifyDownloadToken(request.nextUrl.searchParams.get("t"), key);
    if (id === null) return apiError("Link de download inválido ou expirado. Gere outro no painel.", 403);

    const item = await fetchBackupMeta(id);
    if (!item) return apiError("Backup não encontrado ou expirado.", 404);
    const file = await downloadBackup(id, key);

    // Resposta em stream: evita o limite de corpo de resposta das funções.
    const chunk = 256 * 1024;
    let offset = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset >= file.length) return controller.close();
        controller.enqueue(new Uint8Array(file.subarray(offset, offset + chunk)));
        offset += chunk;
      },
    });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Length": String(file.length),
        "Content-Disposition": `attachment; filename="${item.name}"`,
        "Cache-Control": "no-store, private",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
);
