// ─── Domain Types ─────────────────────────────────────────────────────────────


export type {
  ClientAddress,
  CreateClientAddressPayload,
  UpdateClientAddressPayload,
  ClientAddressFormData,
  ClientAddressFormErrors,
  AddressTableState,
  AddressTableAction,
} from "./client_adresses";

import type { ClientAddress } from "./client_adresses";
export interface ClientResponse {
  data: Client;
}
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

// ─── Request / Response shapes ────────────────────────────────────────────────

export type CreateClientPayload = Omit<Client, "id" | "createdAt" | "updatedAt" | "addresses">;
export type UpdateClientPayload = Partial<CreateClientPayload>;

// ─── Form & Validation ────────────────────────────────────────────────────────

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

// ─── Table State / Reducer ─────────────────────────────────────────────────────

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
// ─── Archive: Client ────────────────────────────────────────────────────────

// Archived client resource returned by the archive endpoints
export interface ArchivedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  addresses?: ClientAddress[];
}

// GET /client/archived/{id}
export interface ArchivedClientResponse {
  data: ArchivedClient;
}

// GET /client/archived — uses `meta`, not `pagination`, matching the
// archived-users list shape rather than the live client list shape.
export interface ArchivedClientListResponse {
  data: {
    data: ArchivedClient[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// ─── Archive: Client orders ─────────────────────────────────────────────────

// Archived order belonging to a specific client
export interface ArchivedClientOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// GET /client/{id}/orders/archived
export interface ArchivedClientOrdersResponse {
  data: {
    data: ArchivedClientOrder[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}