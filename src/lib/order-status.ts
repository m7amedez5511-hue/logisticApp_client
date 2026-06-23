// Single source of truth for order status display logic.
// Imports OrderStatus from src/types/order (not the legacy helperFun).
import type { OrderStatus } from "@/src/types/order";

export type { OrderStatus };

const STATUS_COLORS: Record<string, string> = {
  Created:    "bg-blue-50 text-blue-700 border-blue-200",
  Assigned:   "bg-purple-50 text-purple-700 border-purple-200",
  InTransit:  "bg-amber-50 text-amber-700 border-amber-200",
  Delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Returned:   "bg-red-50 text-red-600 border-red-200",
  Cancelled:  "bg-slate-50 text-slate-600 border-slate-200",
  // Legacy uppercase variants (client portal)
  CREATED:    "bg-blue-50 text-blue-700 border-blue-200",
  IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
  DELIVERED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED:  "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  Created:    "تم الإنشاء",
  Assigned:   "مُعيَّن",
  InTransit:  "قيد التوصيل",
  Delivered:  "تم التسليم",
  Returned:   "مُرتجع",
  Cancelled:  "ملغي",
  CREATED:    "تم الإنشاء",
  IN_TRANSIT: "قيد التوصيل",
  DELIVERED:  "تم التسليم",
  CANCELLED:  "ملغي",
};

/** Tailwind class string for a status badge */
export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
}

/** Arabic label for a status */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}