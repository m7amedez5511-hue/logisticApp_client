// All TypeScript interfaces for the Car Maintenance module.
// This file follows the same pattern as src/types/car.ts so the two
// modules feel consistent to work with.

// ── Status helpers ───────────────────────────────────────────────────────────
// Worked out entirely on the frontend from endAt + isDeleted — the backend
// itself never sends a status field.
export type MaintenanceStatus = "Ongoing" | "EndingToday" | "Completed" | "Archived";

export const MAINTENANCE_STATUS_MAP: Record<MaintenanceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  Ongoing:     { label: "جارية",        color: "#854D0E", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  EndingToday: { label: "تنتهي اليوم",  color: "#9A3412", bg: "#FFF7ED", border: "#FED7AA", dot: "#EA580C" },
  Completed:   { label: "منتهية",       color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", dot: "#16A34A" },
  Archived:    { label: "مؤرشفة",       color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", dot: "#DC2626" },
};

/**
 * Works out a record's status:
 * - isDeleted → Archived (highest priority, regardless of dates)
 * - no endAt → Ongoing
 * - endAt before today → Completed
 * - endAt is today → EndingToday
 * - endAt after today → Ongoing
 */
export function getMaintenanceStatus(
  record: Pick<CarMaintenance, "endAt" | "isDeleted">,
): MaintenanceStatus {
  if (record.isDeleted) return "Archived";
  if (!record.endAt) return "Ongoing";

  const end = new Date(record.endAt);
  const today = new Date();

  // Compare calendar dates only — ignore time-of-day.
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  if (endDay < todayDay) return "Completed";
  if (endDay === todayDay) return "EndingToday";
  return "Ongoing";
}

// ── Shared date + money helpers ──────────────────────────────────────────────

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export function fmtDateShort(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function fmtCost(cost?: number | null): string {
  if (cost === undefined || cost === null) return "—";
  return `${cost.toLocaleString("ar-SA")} ر.س`;
}

/** How many days a maintenance job has taken (or is still taking). */
export function durationDays(startAt: string, endAt?: string | null): number {
  const start = new Date(startAt).getTime();
  const end = endAt ? new Date(endAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

// ── Core Maintenance record ──────────────────────────────────────────────────

export interface CarMaintenance {
  id: string;
  carId: string;

  reason: string;
  cost: number;
  startAt: string;
  endAt?: string | null;

  isActive: boolean;
  /** Soft-delete flag from the backend. Records fetched from the normal
   *  (non-archived) endpoints should always have this false — we filter
   *  any stragglers out client-side in useCarMaintenanceList. */
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;

  // Optional expanded relation — present when the record is fetched
  // together with its parent car (e.g. from a "for this car" list).
  car?: {
    id: string;
    manufacturer: string;
    model: string;
    plateNumber: string;
    plateLetters: string;
  } | null;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateMaintenancePayload {
  reason: string;
  cost: number;
  startAt: string;
  endAt?: string;
}

export type UpdateMaintenancePayload = Partial<CreateMaintenancePayload> & {
  isActive?: boolean;
};

// ── API Responses ─────────────────────────────────────────────────────────────

export interface MaintenanceListResponse {
  data: CarMaintenance[];
}

export interface MaintenanceDetailResponse {
  data: CarMaintenance;
}

// ── Form state ────────────────────────────────────────────────────────────────

export interface MaintenanceFormErrors {
  reason?: string;
  cost?: string;
  startAt?: string;
  endAt?: string;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export interface MaintenanceToastMsg {
  type: "success" | "error";
  message: string;
}