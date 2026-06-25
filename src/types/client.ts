// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  addresses?: ClientAddress[];
}

// FIX: this interface was flat (street, city, state... directly on the object)
// but the real API / form / validator use a NESTED shape (details, contactPerson,
// location). Updated to match what Addressformmodal.tsx actually reads
// (editAddress?.details?.city, editAddress?.contactPerson?.phone, etc).
export interface ClientAddress {
  id: string;
  clientId: string;
  label: string;        // e.g. "Billing", "Shipping", "HQ"

  // was missing before — needed because the form reads editAddress?.branchName
  branchName: string | null;

  // was missing before — needed because the form reads editAddress?.contactPerson?.name/phone
  contactPerson?: {
    name?: string;
    phone?: string;
  };

  // was flat (street/city/state/postalCode/country) — now nested under "details"
  // to match details.city, details.street, etc. used in the form and validator
  details: {
    country: string;
    city: string;
    state?: string;
    district?: string;
    street: string;
    buildingNo?: string;
    unitNo?: string;
    additionalNo?: string;
    zipCode?: string;
    apartment?: string;
  };

  // was missing before — needed because the form reads
  // editAddress?.location?.coordinates
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };

  isPrimary: boolean;
  isValidated?: boolean; // backend-only flag used by updateAddressSchema
  createdAt: string;
  updatedAt: string;
}

// ─── Request / Response shapes ────────────────────────────────────────────────

export type CreateClientPayload = Omit<Client, "id" | "createdAt" | "updatedAt" | "addresses">;
export type UpdateClientPayload = Partial<CreateClientPayload>;

export type CreateClientAddressPayload = Omit<
  ClientAddress,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateClientAddressPayload = Partial<CreateClientAddressPayload>;

// ─── Form & Validation ────────────────────────────────────────────────────────

// FIX: taxId and notes are optional in the actual client form (yup .optional()),
// but this interface marked them as required strings. That mismatch is what
// caused the "Property 'taxId' is missing" type error on onSubmit.
// NOTE: if your form schema truly requires these fields, do the opposite —
// remove the "?" here AND make sure the yup schema uses .required() too.
export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  taxId?: string;
  notes?: string;
}

export interface ClientFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  notes?: string;
}

export interface ClientAddressFormData {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface ClientAddressFormErrors {
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ─── Table State / Reducer (mirrors user.ts TableState / TableAction) ─────────

export type ClientTableState = {
  clients: Client[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
};

export type ClientTableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; clients: Client[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD"; client: Client }
  | { type: "UPDATE"; client: Client }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };

export type AddressTableState = {
  addresses: ClientAddress[];
  loading: boolean;
  error: string | null;
};

export type AddressTableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; addresses: ClientAddress[] }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD"; address: ClientAddress }
  | { type: "UPDATE"; address: ClientAddress }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };

// ─── Generic API wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  data: {
    data: T[];
    pagination: { total: number; page: number; pages: number };
    meta?: { total: number; pages: number };
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}