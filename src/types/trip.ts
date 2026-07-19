export type TripStatus = "Scheduled" | "InProgress" | "Completed" | "Cancelled";

// ── Embedded summaries returned inside Trip responses ───────────────────────
// NOTE: Car has no dedicated types/car.ts in this handoff — these summaries
// are inferred from the response field list in trip_api_reference.html.
// If a real types/car.ts already exists in the project, prefer importing
// from there instead of duplicating this shape.

export interface TripDriverSummary {
  id?: string;
  name: string;
  userName?: string | null;
  email?: string | null;
  address?: string | null;
  nationality?: string | null;
  nationalId?: string | null;
  gosiNumber?: string | null;
  phone: string;
  licenseNumber?: string | null;
  driverCardNumber?: string | null;
}

export interface TripCarSummary {
  id?: string;
  manufacturer: string;
  model: string;
  year?: number | null;
  color?: string | null;
  plateNumber: string;
  plateLetters?: string | null;
  plateType?: string | null;
  registrationNumber?: string | null;
  ownerNationalId?: string | null;
}

export interface TripBranchSummary {
  id?: string;
  name: string;
}

// ── Core Trip ─────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  tripNumber: string;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  status: TripStatus;
  collectedCount: number;
  deliveredCount: number;
  returnedCount: number;
  totalCashCollected?: number | string | null;
  notes?: string | null;
  endReason?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;

  driverId?: string;
  carId?: string;
  branchId?: string | null;

  driver?: TripDriverSummary | null;
  car?: TripCarSummary | null;
  branch?: TripBranchSummary | null;

  createdAt: string;
  updatedAt: string;
}

// ── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateTripPayload {
  title: string;
  driverId: string;
  carId: string;
  startTime?: string;
  endTime?: string;
  branchId?: string;
  status?: TripStatus;
  collectedCount?: number;
  deliveredCount?: number;
  returnedCount?: number;
  totalCashCollected?: number | string;
  notes?: string;
  endReason?: string;
}

export type UpdateTripPayload = Partial<CreateTripPayload> & {
  /** Reason for changing driverId/carId — recorded in history. Update-only field. */
  reason?: string;
};

// ── List query params (GET /trips) ───────────────────────────────────────────

export interface TripListParams {
  status?: TripStatus;
  driverId?: string;
  carId?: string;
  branchId?: string;
  /** Searches across tripNumber, status, title, carId, driverId */
  search?: string;
  sort?: "createdAt" | "tripNumber" | "status" | "startTime" | "endTime";
  page?: number;
  limit?: number;
}

// ── API Responses ─────────────────────────────────────────────────────────────

export interface TripListResponse {
  data: {
    data: Trip[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface TripDetailResponse {
  data: Trip;
}

export interface TripReportResponse {
  data: {
    reportUrl: string;
  };
}

// ── Form state ────────────────────────────────────────────────────────────────

export interface TripFormErrors {
  title?: string;
  driverId?: string;
  carId?: string;
  startTime?: string;
  endTime?: string;
  branchId?: string;
  status?: string;
  collectedCount?: string;
  deliveredCount?: string;
  returnedCount?: string;
  totalCashCollected?: string;
  notes?: string;
  endReason?: string;
  reason?: string;
}

// ── Status display config (mirrors DRIVER_STATUS_MAP) ───────────────────────

export const TRIP_STATUS_MAP: Record<
  TripStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  Scheduled:  { label: "مجدولة", color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  InProgress: { label: "جارية",  color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  Completed:  { label: "مكتملة", color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", dot: "#16A34A" },
  Cancelled:  { label: "ملغاة",  color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", dot: "#DC2626" },
}; 

// ── Archived Trip types (mirrors ArchivedUser pattern in types/user.ts) ─────
// GET /trip/archived/{id}
export interface ArchivedTripResponse {
  data: Trip;
}

// GET /trip/archived — paginated list
export interface ArchivedTripListResponse {
  data: {
    data: Trip[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
export interface TripListResult {
  items: Trip[];
  total: number;
  pages: number;
}

export interface TripReportResult {
  reportUrl: string;
}