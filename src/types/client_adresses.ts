// ─── Address Domain Types ──────────────────────────────────────────────────

export interface ClientAddress {
  id: string;
  clientId: string;
  label: string; // e.g. "Billing", "Shipping", "HQ"

  // needed because the form reads editAddress?.branchName
  branchName: string | null;

  // needed because the form reads editAddress?.contactPerson?.name/phone
  contactPerson?: {
    name?: string;
    phone?: string;
  };

  // nested under "details" to match details.city, details.street, etc.
  // used in the form and validator
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

  // needed because the form reads editAddress?.location?.coordinates
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };

  isPrimary: boolean;
  isValidated?: boolean; // backend-only flag used by updateAddressSchema
  createdAt: string;
  updatedAt: string;
}

// ─── Request / Response shapes ─────────────────────────────────────────────

export type CreateClientAddressPayload = Omit<
  ClientAddress,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateClientAddressPayload = Partial<CreateClientAddressPayload>;

// ─── Legacy flat form shape (kept for any code still using it) ────────────

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

// ─── Table State / Reducer (mirrors client.ts ClientTableState pattern) ───

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