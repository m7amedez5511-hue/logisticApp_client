// types/car.ts
// All TypeScript interfaces for the Car module.

export type CarStatus = "Active" | "InMaintenance" | "InTrip" | "Inactive";
export type InsuranceStatus = "Valid" | "Expired" | "NotInsured";
export type ImpoundStatus = "None" | string;
export type ImageStage = "BEFORE" | "AFTER" | "GENERAL";

// ── Core Car ────────────────────────────────────────────────────────────────

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

// ── Car Image ────────────────────────────────────────────────────────────────

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

// ── Payloads ────────────────────────────────────────────────────────────────

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

// ── API Responses ────────────────────────────────────────────────────────────

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

// ── Form state ───────────────────────────────────────────────────────────────

export interface CarFormErrors {
  manufacturer?: string;
  model?: string;
  year?: string;
  plateNumber?: string;
  plateLetters?: string;
  registrationNumber?: string;
  vinNumber?: string;
}