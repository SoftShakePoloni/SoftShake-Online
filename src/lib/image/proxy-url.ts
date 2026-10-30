const STORAGE_BUCKETS = new Set(["SoftShake Images", "images"]);

/** Replaces a Supabase storage URL or path with an app-owned image endpoint. */
export function imageProxyUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  let bucket = "SoftShake Images";
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const match = url.pathname.match(
        /\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/
      );
      if (!match) return value;
      bucket = decodeURIComponent(match[1]);
      path = decodeURIComponent(match[2]);
    } catch {
      return value;
    }
  }

  if (!STORAGE_BUCKETS.has(bucket)) return value;
  const params = new URLSearchParams({ bucket, path });
  return `/api/imagem/arquivo?${params.toString()}`;
}
