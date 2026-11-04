/** Backups diários gerados por .github/workflows/supabase-backup.yml no bucket privado "backups". */
export const BACKUP_BUCKET = "backups";
export const BACKUP_NAME = /^softshake-(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})\.tar\.gz$/;
/** Um backup diário atrasado mais de 26 h indica que o agendamento falhou. */
export const BACKUP_STALE_MS = 26 * 60 * 60 * 1000;

export type BackupItem = { name: string; size: number | null; takenAt: string };

/** Data do backup a partir do nome (horário de Brasília, UTC-3). */
export function backupTakenAt(name: string): string | null {
  const m = BACKUP_NAME.exec(name);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isBackupName(name: unknown): name is string {
  return typeof name === "string" && backupTakenAt(name) !== null;
}

export function backupHealth(items: BackupItem[], now = Date.now()): "ok" | "stale" | "empty" {
  if (!items.length) return "empty";
  return now - new Date(items[0].takenAt).getTime() > BACKUP_STALE_MS ? "stale" : "ok";
}

export function formatBytes(size: number | null) {
  if (size == null) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
