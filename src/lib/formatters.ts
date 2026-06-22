
/**
 * Format an ISO date string as a localised Arabic date.
 * @example fmtDate("2026-06-08T10:00:00Z") → "٨ يونيو ٢٠٢٦"
 */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
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