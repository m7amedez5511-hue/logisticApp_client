/**
 * @deprecated Use imports from src/lib/ instead:
 *   - Session helpers → src/lib/session.ts
 *   - Formatters      → src/lib/formatters.ts
 *   - Auth helpers    → src/lib/auth.ts
 *
 * This file is kept only for backwards compatibility during migration.
 * It will be removed in Phase 3.
 */

// Re-export from canonical locations so existing imports still resolve.
export {
  SESSION_KEY,
  SESSION_COOKIE,
  getCookie,
  setCookie,
  deleteCookie,
  loadSession,
  saveSession,
  clearSession,
} from "@/src/lib/session";

export type { ClientSession } from "@/src/lib/session";

export { fmtDate, fmtAmount } from "@/src/lib/formatters";

// ── Order Status (legacy — now in src/lib/order-status.ts) ────────────────
/** @deprecated import from src/lib/order-status.ts */
export type OrderStatus = "CREATED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

/** @deprecated import from src/lib/order-status.ts */
export function statusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    CREATED:    "bg-blue-50 text-blue-700 border-blue-200",
    IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
    DELIVERED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED:  "bg-red-50 text-red-600 border-red-200",
  };
  return map[status];
}

/** @deprecated import from src/lib/order-status.ts */
export function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    CREATED:    "تم الإنشاء",
    IN_TRANSIT: "قيد التوصيل",
    DELIVERED:  "تم التسليم",
    CANCELLED:  "ملغي",
  };
  return map[status];
}