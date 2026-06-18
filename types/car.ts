// types/car.ts
// All TypeScript interfaces for the Car module.

export type CarStatus = "Active" | "InMaintenance" | "InTrip" | "Inactive";
export type InsuranceStatus = "Valid" | "Expired" | "NotInsured";
export type ImpoundStatus = "None" | string;
export type ImageStage = "BEFORE" | "AFTER" | "GENERAL";

// ── Status display config ────────────────────────────────────────────────────
// Used by page.tsx (CarCard) and CarDetailPanel
export const STATUS_MAP: Record<
  CarStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  Active:        { label: "نشط",      color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", dot: "#16A34A" },
  InMaintenance: { label: "صيانة",    color: "#854D0E", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  InTrip:        { label: "في رحلة",  color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  Inactive:      { label: "غير نشط", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0", dot: "#94A3B8" },
};

export const INS_MAP: Record<InsuranceStatus, { label: string; color: string }> = {
  Valid:      { label: "سارٍ",        color: "#16A34A" },
  Expired:    { label: "منتهي",       color: "#DC2626" },
  NotInsured: { label: "غير مؤمَّن", color: "#D97706" },
};

// ── Stage display config ─────────────────────────────────────────────────────
// Used by CarImageGallery
export const STAGE_MAP: Record<ImageStage, { label: string; color: string; bg: string }> = {
  BEFORE:  { label: "قبل", color: "#854D0E", bg: "#FFFBEB" },
  AFTER:   { label: "بعد", color: "#166534", bg: "#DCFCE7" },
  GENERAL: { label: "عام", color: "#1E40AF", bg: "#EFF6FF" },
};

// ── Shared date helpers ───────────────────────────────────────────────────────
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

/** Returns true if the date is within 90 days in the future (or already past) */
export function isExpiringSoon(iso?: string | null): boolean {
  if (!iso) return false;
  return (new Date(iso).getTime() - Date.now()) / 86_400_000 <= 90;
}

// ── Core Car ─────────────────────────────────────────────────────────────────

export interface Car {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  color?: string | null;

  plateNumber: string;
  plateLetters: string;
  plateType?: string | null;

  registrationNumber?: string | null;
  vinNumber?: string | null;
  ownerNationalId?: string | null;

  branchId?: string | null;
  branch?: { id?: string; name: string } | null;

  actualUserId?: string | null;
  actualUserStartDate?: string | null;
  ownershipStartDate?: string | null;

  // Regulatory
  registrationIssueDate?: string | null;
  registrationExpiryDate?: string | null;
  registrationPhoto?: string | null;

  insuranceStatus?: InsuranceStatus | null;
  insuranceExpiryDate?: string | null;
  insurancePhoto?: string | null;

  inspectionStatus?: string | null;
  inspectionExpiryDate?: string | null;

  operationCardNumber?: string | null;
  operationCardExpiry?: string | null;

  gpsDeviceId?: string | null;
  currentStatus: CarStatus;
  currentImpoundStatus?: string | null;
  capacity?: number | null;
  weight?: number | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Expanded relations (detail view)
  statusHistory?: CarStatusHistoryEntry[];
}

export interface CarStatusHistoryEntry {
  id: string;
  carStatus: CarStatus;
  impoundStatus?: string | null;
  createdAt: string;
}

// ── Car Image ─────────────────────────────────────────────────────────────────

export interface CarImage {
  id: string;
  carId: string;
  maintenanceId?: string | null;
  image: string;
  publicId?: string | null;
  stage?: ImageStage | null;
  url?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDeleted: boolean;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateCarPayload {
  manufacturer: string;
  model: string;
  year: number;
  color?: string;
  plateNumber: string;
  plateLetters: string;
  plateType?: string;
  registrationNumber?: string;
  vinNumber?: string;
  ownerNationalId?: string;
  branchId?: string;
  actualUserId?: string;
  actualUserStartDate?: string;
  ownershipStartDate?: string;
  registrationIssueDate?: string;
  registrationExpiryDate?: string;
  registrationPhoto?: string;
  insuranceStatus?: InsuranceStatus;
  insuranceExpiryDate?: string;
  insurancePhoto?: string;
  inspectionStatus?: string;
  inspectionExpiryDate?: string;
  operationCardNumber?: string;
  operationCardExpiry?: string;
  gpsDeviceId?: string;
  currentStatus?: CarStatus;
  currentImpoundStatus?: string;
  capacity?: number;
  weight?: number;
}

export type UpdateCarPayload = Partial<CreateCarPayload> & { isActive?: boolean };

// ── API Responses ─────────────────────────────────────────────────────────────

export interface CarListResponse {
  data: {
    data: Car[];
    pagination: { total: number; page: number; pages: number };
    meta?: { total: number; pages: number };
  };
}

export interface CarDetailResponse {
  data: Car;
}

export interface CarImageListResponse {
  data: CarImage[];
}

// ── Form state ────────────────────────────────────────────────────────────────

export interface CarFormErrors {
  manufacturer?: string;
  model?: string;
  year?: string;
  plateNumber?: string;
  plateLetters?: string;
  registrationNumber?: string;
  vinNumber?: string;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export interface ToastMsg {
  type: "success" | "error";
  message: string;
}