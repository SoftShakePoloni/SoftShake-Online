import "server-only";
import { createHash } from "node:crypto";
import { createServerClient } from "@/integrations/supabase/client.server";
import { imageCacheSeconds } from "./cache-policy";

type Source = { bytes: ArrayBuffer; type: string; etag: string };
const pending = new Map<string, Promise<Source | null>>();

/** Deduplicate concurrent sizes; cache original bytes only in Next's server Data Cache. */
export function readStorageImage(bucket: string, path: string): Promise<Source | null> {
  const key = JSON.stringify([bucket, path]);
  const existing = pending.get(key);
  if (existing) return existing;
  const request = (async () => {
    const options = { cache: "force-cache" as RequestCache, next: { revalidate: imageCacheSeconds(path) } };
    const { data, error } = await createServerClient().storage.from(bucket).download(path, {}, options);
    if (error || !data) return null;
    const bytes = await data.arrayBuffer();
    return { bytes, type: data.type || "application/octet-stream", etag: `"${createHash("sha256").update(new Uint8Array(bytes)).digest("hex")}"` };
  })().finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
