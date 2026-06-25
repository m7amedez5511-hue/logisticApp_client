import { get, post, put, patch, del } from "./api";
import type {
  ApiResponse,
  ClientAddress,
  ClientAddressFormData,
} from "@/src/types/client";

const base = (clientId: string) => `client/${clientId}/addresses`;

export const clientAddressService = {
  /** get all client adresses*/
  getAll: (clientId: string, token: string | null) =>
    get<ApiResponse<ClientAddress[]>>(base(clientId), token),

  /** get adress by id*/
  getById: (clientId: string, addressId: string, token: string | null) =>
    get<ApiResponse<ClientAddress>>(`${base(clientId)}/${addressId}`, token),

  /** create new client adress*/
  create: (clientId: string, data: ClientAddressFormData, token: string | null) =>
    post<ApiResponse<ClientAddress>>(base(clientId), buildPayload(clientId, data), token),

  /** update adresses*/
  update: (clientId: string, addressId: string, data: ClientAddressFormData, token: string | null) =>
    put<ApiResponse<ClientAddress>>(`${base(clientId)}/${addressId}`, buildPayload(clientId, data), token),

  /** delete client adresses*/
  delete: (clientId: string, addressId: string, token: string | null) =>
    del<void>(`${base(clientId)}/${addressId}`, token),

  /** but adesses as a main client addresses*/
  setPrimary: (clientId: string, addressId: string, token: string | null) =>
    patch<ApiResponse<ClientAddress>>(`${base(clientId)}/${addressId}/primary`, {}, token),
};

/** cheange adress info to payload */
function buildPayload(clientId: string, data: ClientAddressFormData): Record<string, unknown> {
  return {
    clientId,
    label:      data.label.trim(),
    street:     data.street.trim(),
    city:       data.city.trim(),
    state:      data.state.trim(),
    postalCode: data.postalCode.trim(),
    country:    data.country.trim(),
    isPrimary:  data.isPrimary,
  };
}