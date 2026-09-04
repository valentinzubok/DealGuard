/** Prefix paths when site is served under /DealGuard on GitHub Pages. */
export function withBase(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || process.env.NEXT_BASE_PATH || "";
  if (!path.startsWith("/")) return path;
  if (!base) return path;
  return `${base}${path}`;
}
