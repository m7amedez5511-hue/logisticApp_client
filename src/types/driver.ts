export type DriverStatus = "Active" | "Inactive" | "InTrip" | "Suspended";
export type NationalIdType = "NationalID" | "Iqama" | "Passport";
export type DriverCardType = "Temporary" | "Seasonal" | "Annual" | "Restricted";

// ── Core Driver ──────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  userName?: string | null;
  email?: string | null;
  address?: string | null;
  nationality?: string | null;
  nationalId?: string | null;
  nationalIdType?: NationalIdType | null;
  nationalIdExpiry?: string | null;
  gosiNumber?: string | null;
  phone: string;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseExpiry?: string | null;
  photo?: string | null;
  nationalPhoto?: string | null;
  driverCardPhoto?: string | null;
  driverCardNumber?: string | null;
  driverCardType?: DriverCardType | null;
  driverCardExpiry?: string | null;
  driverType?: string | null;
  status: DriverStatus;
  branchId?: string | null;
  branch?: { name: string } | null;
  statusHistory?: DriverStatusHistoryEntry[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  photoUrl?: string | null;
  nationalPhotoUrl?: string | null;
  driverCardPhotoUrl?: string | null;
}


export interface DriverStatusHistoryEntry {
  id: string;
  status: DriverStatus;
  reason?: string | null;
  createdAt: string;
}

// ── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateDriverPayload {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
  nationalIdType?: NationalIdType;
  gosiNumber?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: string;
  driverCardNumber?: string;
  driverCardType?: DriverCardType;
  driverCardExpiry?: string;
  driverType?: string;
  branchId?: string;
}

export type UpdateDriverPayload = Partial<CreateDriverPayload> & {
  status?: DriverStatus;
  reason?: string;
};

// ── API Responses ─────────────────────────────────────────────────────────────

export interface DriverListResponse {
  data: {
    data: Driver[];
    pagination: { total: number; page: number; pages: number };
    meta?: { total: number; pages: number };
  };
}

export interface DriverDetailResponse {
  data: Driver;
}

export interface DriverReportResponse {
  data: {
    reportUrl: string;
    filename: string;
  };
}

// ── Form state ────────────────────────────────────────────────────────────────

export interface DriverFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

export const DRIVER_STATUS_MAP: Record<
  DriverStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  Active:    { label: "نشط",      color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", dot: "#16A34A" },
  InTrip:    { label: "في رحلة",  color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  Inactive:  { label: "غير نشط", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0", dot: "#94A3B8" },
  Suspended: { label: "موقوف",   color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", dot: "#DC2626" },
};

export const NATIONAL_ID_TYPE_MAP: Record<NationalIdType, string> = {
  NationalID: "هوية وطنية",
  Iqama:      "إقامة",
  Passport:   "جواز سفر",
};

export const DRIVER_CARD_TYPE_MAP: Record<DriverCardType, string> = {
  Temporary: "مؤقتة",
  Seasonal:  "موسمية",
  Annual:    "سنوية",
  Restricted: "مقيدة",
};

// ── Archived Driver ──────────────────────────────────────────────────────────
// Resource returned by the /driver/archived endpoints. Kept as a distinct
// shape (rather than reusing Driver) since the archive endpoints return a
// flatter, slightly different set of fields — mirrors the ArchivedUser
// pattern in src/types/user.ts.

export interface ArchivedDriver {
  id: string;
  name: string;
  userName?: string | null;
  email?: string | null;
  phone: string;
  address?: string | null;
  nationality?: string | null;
  nationalId?: string | null;
  nationalIdType?: NationalIdType | null;
  gosiNumber?: string | null;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseExpiry?: string | null;
  photo?: string | null;
  photoUrl?: string | null;
  nationalPhoto?: string | null;
  nationalPhotoUrl?: string | null;
  driverCardPhoto?: string | null;
  driverCardPhotoUrl?: string | null;
  driverCardNumber?: string | null;
  driverCardType?: DriverCardType | null;
  status: DriverStatus;
  isActive: boolean;
  isDeleted: boolean;
  driverType?: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /driver/archived
export interface ArchivedDriverListResponse {
  data: {
    data: ArchivedDriver[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// GET /driver/archived/{id}
export interface ArchivedDriverResponse {
  data: ArchivedDriver;
}

// GET /driver/archived/driverStatus/{id}
export interface ArchivedDriverStatusHistoryResponse {
  data: DriverStatusHistoryEntry[];
}
// ── Clean, unwrapped shapes returned by driverService ──

export interface DriverListResult {
  items: Driver[];
  total: number;
  pages: number;
}

export interface DriverReportResult {
  reportUrl: string;
  filename: string;
}

/** Minimal shape used by dropdowns (TripFormModal etc.) */
export interface DriverOption {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
}