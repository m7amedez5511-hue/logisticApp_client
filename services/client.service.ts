// services/client.service.ts

import { get, post } from "./api";
import type { ClientAddress, Order } from "../types/client";

export interface CreateClientPayload {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface CreateAddressPayload {
  label: string;
  branchName?: string | null;
  contactPerson: { name: string; phone: string };
  details: {
    city: string;
    district?: string;
    street: string;
    buildingNo?: string;
    unitNo?: string;
    zipCode?: string;
  };
}

export const clientService = {
  /** Register a new client account */
  create: (payload: CreateClientPayload) =>
    post<{ id: string; name: string; email: string; phone: string }>(
      "client",
      payload,
    ),

  /** Fetch all saved delivery addresses for a client */
  getAddresses: (clientId: string) =>
    get<ClientAddress[]>(`client/${clientId}/addresses`),

  /** Save a new delivery address */
  addAddress: (clientId: string, payload: CreateAddressPayload) =>
    post<ClientAddress>(`client/${clientId}/addresses`, payload),

  /** Fetch all orders placed by a client */
  getOrders: (clientId: string) =>
    get<Order[]>(`client/${clientId}/orders`),
};