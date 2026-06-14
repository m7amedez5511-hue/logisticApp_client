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

export interface ClientAddress {
  id: string;
  clientId: string;
  label: string;        // e.g. "Billing", "Shipping", "HQ"
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
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

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  notes: string;
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