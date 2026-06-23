/**
 * Format an ISO date string as a localised Arabic date.
 * @example fmtDate("2026-06-08T10:00:00Z") → "٨ يونيو ٢٠٢٦"
 */
export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an ISO date string as a long Arabic date.
 * @example fmtDateLong("2026-06-08T10:00:00Z") → "٨ يونيو ٢٠٢٦"
 */
export function fmtDateLong(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a numeric amount as Saudi Riyals.
 * @example fmtAmount(1234.5) → "١٬٢٣٤٫٥٠ ر.س"
 */
export function fmtAmount(n: number): string {
  return `${n.toFixed(2)} ر.س`;
}

/**
 * Returns true if the date is within 90 days in the future (or already past).
 */
export function isExpiringSoon(iso?: string | null): boolean {
  if (!iso) return false;
  return (new Date(iso).getTime() - Date.now()) / 86_400_000 <= 90;
}