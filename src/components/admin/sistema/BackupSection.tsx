"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBackupDownloadUrl, listBackups } from "@/actions/admin/backups";
import { BACKUP_RETENTION_DAYS, backupHealth, formatBytes, type BackupItem } from "@/lib/backups";

const ACTIONS_URL =
  "https://github.com/SoftShakePoloni/SoftShake-Online/actions/workflows/supabase-backup.yml";

const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

export function BackupSection() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listBackups();
      setItems(result.items);
      setConfigured(result.configured);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível listar os backups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const download = async (id: number) => {
    setDownloading(id);
    setError("");
    try {
      const url = new URL(await getBackupDownloadUrl(id), window.location.href).href;
      // Nova aba: no app Windows abre no navegador, que faz o download.
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível baixar o backup.");
    } finally {
      setDownloading(null);
    }
  };

  const health = backupHealth(items);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-[#111827]">Backup</h2>
        <p className="mb-3 text-sm text-[#6B7280]">
          Cópia completa do banco de dados feita todos os dias às 23:30 e guardada criptografada no GitHub. Os
          backups dos últimos {BACKUP_RETENTION_DAYS} dias ficam disponíveis.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3F4F6] px-4 py-3.5">
          <span className="text-sm text-[#6B7280]">Situação</span>
          <span
            className={cn(
              "text-sm font-medium",
              health === "ok" ? "text-emerald-700" : health === "stale" ? "text-amber-700" : "text-[#6B7280]",
            )}
          >
            {loading
              ? "Carregando…"
              : health === "ok"
                ? `Em dia · último em ${when(items[0].takenAt)}`
                : health === "stale"
                  ? `Atrasado · último em ${when(items[0].takenAt)}`
                  : "Nenhum backup ainda"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <span className="text-sm text-[#6B7280]">Agendamento</span>
          <span className="text-sm font-medium text-[#111827]">Todos os dias às 23:30</span>
        </div>
      </div>

      {(health === "stale" || (!loading && !configured)) && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {configured
            ? "O backup de ontem não chegou. Confira a execução no GitHub Actions."
            : "Backup não configurado no servidor: faltam BACKUP_ENCRYPTION_KEY e GITHUB_BACKUP_TOKEN."}{" "}
          <a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
            Abrir GitHub Actions
          </a>
        </p>
      )}

      <section aria-labelledby="backup-list">
        <div className="mb-2 flex items-center justify-between">
          <h3 id="backup-list" className="text-sm font-semibold text-[#111827]">
            Backups guardados {items.length > 0 && <span className="font-normal text-[#9CA3AF]">({items.length})</span>}
          </h3>
          <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => void load()} disabled={loading}>
            Atualizar lista
          </Button>
        </div>
        {error && (
          <p role="alert" className="mb-2 text-sm text-[#B42318]">
            {error}
          </p>
        )}
        <div className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-[#6B7280]">Carregando backups…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#6B7280]">
              Nenhum backup guardado ainda. O próximo será feito hoje às 23:30.
            </p>
          ) : (
            <ul className="divide-y divide-[#F3F4F6]">
              {items.map((item, index) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111827]">
                      {when(item.takenAt)}
                      {index === 0 && (
                        <span className="ml-2 rounded-full bg-[#F3EFFA] px-2 py-0.5 text-[11px] font-semibold text-[#4C258C]">
                          Mais recente
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">{formatBytes(item.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={downloading !== null}
                    onClick={() => void download(item.id)}
                  >
                    {downloading === item.id && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    Baixar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-2 text-xs text-[#9CA3AF]">
          Cada arquivo traz as instruções de restauração (RESTAURAR.txt). Imagens do cardápio não fazem parte do
          backup do banco.
        </p>
      </section>
    </div>
  );
}
