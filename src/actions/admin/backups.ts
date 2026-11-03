"use server";

import { requirePermission } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/integrations/supabase/client.server";
import { writeAudit } from "@/lib/security/audit";
import {
  BACKUP_BUCKET,
  backupTakenAt,
  isBackupName,
  type BackupItem,
} from "@/lib/backups";

/**
 * Backups contêm todos os dados da loja (inclusive dados pessoais de clientes):
 * listagem e download ficam restritos ao administrador (admin:manage).
 */
export async function listBackups(): Promise<{ configured: boolean; items: BackupItem[] }> {
  await requirePermission("admin:manage");
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
  if (error) {
    // Bucket ainda não criado: o primeiro backup do workflow cria.
    if (/not.?found|does not exist/i.test(error.message)) return { configured: false, items: [] };
    throw new Error("Não foi possível listar os backups.");
  }
  const items = (data ?? [])
    .filter((file) => isBackupName(file.name))
    .map((file) => ({
      name: file.name,
      size: typeof file.metadata?.size === "number" ? file.metadata.size : null,
      takenAt: backupTakenAt(file.name)!,
    }))
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  return { configured: true, items };
}

/** Link de download temporário (60 s) para um backup específico. */
export async function getBackupDownloadUrl(name: string): Promise<string> {
  const admin = await requirePermission("admin:manage");
  if (!isBackupName(name)) throw new Error("Backup inválido.");
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .createSignedUrl(name, 60, { download: name });
  if (error || !data?.signedUrl) throw new Error("Não foi possível gerar o download.");
  await writeAudit({
    actorId: admin.admin.id,
    actorEmail: admin.admin.email,
    action: "backup.download",
    entity: "backup",
    entityId: name,
  });
  return data.signedUrl;
}
