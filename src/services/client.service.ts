import { get, post, put, del } from "./api";
import type { ApiResponse, ApiListResponse, Client, ClientFormData, ClientResponse, ClientListResult } from "@/src/types/client";

function buildClientsQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const clientService = {
  getAll: async (page: number, search: string, token: string | null): Promise<ClientListResult> => {
    const res: ApiListResponse<Client> = await get<ApiListResponse<Client>>(
      `client${buildClientsQuery(page, search)}`, token,
    );
    return {
      items: res.data.data,
      total: res.data.meta?.total ?? res.data.pagination?.total ?? 0,
      pages: res.data.meta?.pages ?? res.data.pagination?.pages ?? 1,
    };
  },

  getById: async (id: string, token: string | null): Promise<Client> => {
    const res: ApiResponse<Client> = await get<ApiResponse<Client>>(`client/${id}`, token);
    return res.data;
  },

  create: async (data: ClientFormData, token: string | null): Promise<Client> => {
    const res: ClientResponse = await post<ClientResponse>("client", buildPayload(data), token);
    return res.data;
  },

  update: async (id: string, data: ClientFormData, token: string | null): Promise<Client> => {
    const res: ClientResponse = await put<ClientResponse>(`client/${id}`, buildPayload(data), token);
    return res.data;
  },

  delete: (id: string, token: string | null) => del<void>(`client/${id}`, token),
};

function buildPayload(data: ClientFormData): Record<string, string | boolean> {
  const payload: Record<string, string | boolean> = {};
  if (data.name?.trim()) payload.name = data.name.trim();
  if (data.email?.trim()) payload.email = data.email.trim();
  if (data.phone?.trim()) payload.phone = data.phone.trim();
  if (data.taxId?.trim()) payload.taxId = data.taxId.trim();
  if (data.notes?.trim()) payload.notes = data.notes.trim();
  if (data.clientType) payload.clientType = data.clientType;
  if (typeof data.isActive === "boolean") payload.isActive = data.isActive;
  return payload;
}