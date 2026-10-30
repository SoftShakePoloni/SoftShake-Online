/** The upload pipeline creates timestamped names with upsert:false. Legacy paths can be replaced. */
export function imageCacheControl(path: string) {
  return /^Produtos\/[a-z0-9-]+-\d{13}\.webp$/.test(path)
    ? "public, max-age=31536000, s-maxage=31536000, immutable"
    : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";
}

export function imageCacheSeconds(path: string) {
  return imageCacheControl(path).includes("immutable") ? 31536000 : 3600;
}
