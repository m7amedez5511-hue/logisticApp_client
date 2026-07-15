// ─── Address Domain Types ──────────────────────────────────────────────────

export interface ClientAddress {
  id: string;
  clientId: string;
  label: string;

  branchName: string | null;

  contactPerson?: {
    name?: string;
    phone?: string;
  };

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

  location: {
    coordinates: [number, number];
  };

  isPrimary: boolean;
  isValidated?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Request / Response shapes ─────────────────────────────────────────────

export type CreateClientAddressPayload = Omit<
  ClientAddress,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateClientAddressPayload = Partial<CreateClientAddressPayload>;

// ─── Legacy flat form shape ────────────────────────────────────────────────

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

// ─── Table State / Reducer ────────────────────────────────────────────────

export type AddressTableState = {
  addresses: ClientAddress[];
  loading: boolean;
  error: string | null;
};

// SET_PRIMARY_LOCAL removed — primary is now a backend-only concept
export type AddressTableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; addresses: ClientAddress[] }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD"; address: ClientAddress }
  | { type: "UPDATE"; address: ClientAddress }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" }
  // ADDED: Set primary address — flips isPrimary across the whole list in one dispatch
  | { type: "SET_PRIMARY"; id: string };
  // ─── Archive: Client Addresses ─────────────────────────────────────────────

// Archived address resource returned by GET /addresses/archived.
// Kept as its own type (not reusing ClientAddress) because the archive
// endpoint uses `_id` instead of `id` and includes the raw GeoJSON `type`
// field on `location` — mirrors how ArchivedUser is kept separate from User.
export interface ArchivedClientAddress {
  _id: string;
  clientId: string;
  branchName: string | null;
  label: string;
  contactPerson?: {
    name?: string;
    phone?: string;
  };
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
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  isValidated?: boolean;
  isPrimary?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// GET /addresses/archived — NOTE: flat array, no pagination meta,
// unlike users/archived and client/archived. Wrapper mirrors the raw
// API envelope (success/message/responseAt) rather than ApiListResponse<T>.
export interface ArchivedClientAddressListResponse {
  success: boolean;
  message: string;
  responseAt: string;
  data: ArchivedClientAddress[];
}