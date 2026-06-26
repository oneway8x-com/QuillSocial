export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeBullet(b: string) {
  return b.replace(/\s+/g, " ").trim();
}

export function truncate(s: string, n = 200) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
