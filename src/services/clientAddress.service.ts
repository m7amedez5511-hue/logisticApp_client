import { get, post, patch, del } from "./api";
import type { ApiResponse } from "@/src/types/client";
import type { ClientAddress } from "@/src/types/client_adresses";
import type {
  CreateAddressFormValues,
  UpdateAddressFormValues,
} from "@/src/validations/client_address.validator";



const collectionBase = (clientId: string) => {
  if (!clientId) {
    throw new Error(
      "clientAddressService: clientId is required but was empty/undefined. Check useParams() key matches your route folder name."
    );
  }
  return `client/${clientId}/addresses`;
};

const addressBase = (addressId: string) => {
  if (!addressId) {
    throw new Error("clientAddressService: addressId is required but was empty/undefined.");
  }
  return `addresses/${addressId}`;
};

export const clientAddressService = {
  /** Get all addresses for a client — list stays scoped under the client */
  getAll: (clientId: string, token: string | null) =>
    get<ApiResponse<ClientAddress[]>>(collectionBase(clientId), token),

  /**
   * Get a single address by id.

   */
  getById: (clientId: string, addressId: string, token: string | null) =>
    get<ApiResponse<ClientAddress>>(addressBase(addressId), token),

  /** Create a new address — list stays scoped under the client */
  create: (
    clientId: string,
    data: CreateAddressFormValues,
    token: string | null
  ) =>
    post<ApiResponse<ClientAddress>>(collectionBase(clientId), buildPayload(data), token),

  /**
   * Update an existing address.
   */
  update: (
    clientId: string,
    addressId: string,
    data: UpdateAddressFormValues,
    token: string | null
  ) =>
    patch<ApiResponse<ClientAddress>>(
      addressBase(addressId),
      buildPayload(data),
      token
    ),

  /**
   * Delete an address.
   */
  delete: (clientId: string, addressId: string, token: string | null) =>
    del<void>(addressBase(addressId), token),

  
};


 
function buildPayload(
  data: CreateAddressFormValues | UpdateAddressFormValues
): Record<string, unknown> {
  return {
    label: data.label,
    branchName: data.branchName,
    contactPerson: data.contactPerson,
    details: data.details,
    location: data.location,
  };
}