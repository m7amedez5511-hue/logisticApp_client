// lib/order-status.ts
// Order status display config — no React, no network.

import type { OrderStatus } from "../types/client";

export type { OrderStatus };

/** Tailwind class string for a status badge */
export function statusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    CREATED:    "bg-blue-50 text-blue-700 border-blue-200",
    IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
    DELIVERED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED:  "bg-red-50 text-red-600 border-red-200",
  };
  return map[status];
}

/** Arabic label for a status */
export function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    CREATED:    "تم الإنشاء",
    IN_TRANSIT: "قيد التوصيل",
    DELIVERED:  "تم التسليم",
    CANCELLED:  "ملغي",
  };
  return map[status];
}