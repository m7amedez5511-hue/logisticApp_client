import { get, post, put, patch, del } from "./api";
import type { ApiResponse, ClientAddress } from "@/src/types/client";
import type {
  CreateAddressFormValues,
  UpdateAddressFormValues,
} from "@/src/validations/client_address.validator";

// FIX: if clientId is undefined/empty, this used to silently build a broken
// URL like "client/undefined/addresses" which 404s with no clear error.
// Now it throws a clear error pointing at the real problem (missing clientId).
const base = (clientId: string) => {
  if (!clientId) {
    throw new Error("clientAddressService: clientId is required but was empty/undefined. Check useParams() key matches your route folder name.");
  }
  return `client/${clientId}/addresses`;
};

// FIX: same idea as base() above — fail clearly if addressId is missing,
// instead of building "client/123/addresses/undefined"
const withAddressId = (clientId: string, addressId: string) => {
  if (!addressId) {
    throw new Error("clientAddressService: addressId is required but was empty/undefined.");
  }
  return `${base(clientId)}/${addressId}`;
};

export const clientAddressService = {
  /** Get all addresses for a client */
  getAll: (clientId: string, token: string | null) =>
    get<ApiResponse<ClientAddress[]>>(base(clientId), token),

  /** Get a single address by id */
  getById: (clientId: string, addressId: string, token: string | null) =>
    get<ApiResponse<ClientAddress>>(withAddressId(clientId, addressId), token),

  /** Create a new address */
  create: (
    clientId: string,
    data: CreateAddressFormValues,
    token: string | null
  ) =>
    post<ApiResponse<ClientAddress>>(base(clientId), buildPayload(data), token),

  /** Update an existing address */
  update: (
    clientId: string,
    addressId: string,
    data: UpdateAddressFormValues,
    token: string | null
  ) =>
    put<ApiResponse<ClientAddress>>(
      withAddressId(clientId, addressId),
      buildPayload(data),
      token
    ),

  /** Delete an address */
  delete: (clientId: string, addressId: string, token: string | null) =>
    del<void>(withAddressId(clientId, addressId), token),

  /** Promote an address to primary (backend demotes all others) */
  setPrimary: (clientId: string, addressId: string, token: string | null) =>
    patch<ApiResponse<ClientAddress>>(
      `${withAddressId(clientId, addressId)}/primary`,
      {},
      token
    ),
};

/**
 * Maps the validated form shape (nested) directly to the API payload.
 * FIX 1: No more .trim() calls on flat fields that no longer exist —
 * the validator already trims every string field before we reach here.
 */
function buildPayload(
  data: CreateAddressFormValues | UpdateAddressFormValues
): Record<string, unknown> {
  return {
    label:         data.label,
    branchName:    data.branchName,
    isPrimary:     data.isPrimary,
    contactPerson: data.contactPerson,
    details:       data.details,
    location:      data.location,
  };
}