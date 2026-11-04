"use server";

import { requirePermission } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/security/audit";
import type { BackupItem } from "@/lib/backups";
import {
  backupConfigured,
  backupKey,
  fetchBackupList,
  fetchBackupMeta,
  signDownloadToken,
} from "@/lib/backups.server";

/**
 * Backups contêm todos os dados da loja (inclusive dados pessoais de clientes):
 * listagem e download ficam restritos ao administrador (admin:manage).
 */
export async function listBackups(): Promise<{ configured: boolean; items: BackupItem[] }> {
  await requirePermission("admin:manage");
  if (!backupConfigured()) return { configured: false, items: [] };
  try {
    return { configured: true, items: await fetchBackupList() };
  } catch {
    throw new Error("Não foi possível consultar os backups no GitHub.");
  }
}

/** Link de download temporário (60 s) para um backup específico. */
export async function getBackupDownloadUrl(id: number): Promise<string> {
  const admin = await requirePermission("admin:manage");
  const key = backupKey();
  if (!key || !backupConfigured()) throw new Error("Backup não configurado no servidor.");
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Backup inválido.");
  const item = await fetchBackupMeta(id).catch(() => null);
  if (!item) throw new Error("Backup não encontrado ou expirado.");
  await writeAudit({
    actorId: admin.admin.id,
    actorEmail: admin.admin.email,
    action: "backup.download",
    entity: "backup",
    entityId: item.name,
  });
  return `/api/backup/download?t=${encodeURIComponent(signDownloadToken(id, key))}`;
}
