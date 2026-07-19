import { get } from "../api";
import type {
  ArchivedClientListResponse,
  ArchivedClientResponse,
  ArchivedClientOrdersResponse,
} from "@/src/types/client";

/** Building a query string to fetch archived clients with pagination */
function buildArchivedQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const archivedClientService = {
  /** Fetching the archived client list, paginated */
  getAll: (page: number, search: string, token: string | null) =>
    get<ArchivedClientListResponse>(
      `client/archived${buildArchivedQuery(page, search)}`,
      token,
    ),

  /** Get a single archived client by id (includes addresses) */
  getById: (id: string, token: string | null) =>
    get<ArchivedClientResponse>(`client/archived/${id}`, token),

  /** Get soft-deleted orders belonging to a specific client */
  getArchivedOrders: (clientId: string, page: number, token: string | null) =>
    get<ArchivedClientOrdersResponse>(
      `client/${clientId}/orders/archived?page=${page}&limit=10`,
      token,
    ),
getAllUnwrapped: async (page, search, token) => {
  const res = await archivedClientService.getAll(page, search, token);
  return { items: res.data.data, total: res.data.meta.total, pages: res.data.meta.totalPages };
},
getByIdUnwrapped: async (id, token) => (await archivedClientService.getById(id, token)).data,
getArchivedOrdersUnwrapped: async (clientId, page, token) => {
  const res = await archivedClientService.getArchivedOrders(clientId, page, token);
  return { items: res.data.data, total: res.data.meta.total, pages: res.data.meta.totalPages };
},
  // NOTE: delete/restore intentionally left out for now — mirrors
  // archivedUser.service.ts, see ticket follow-up.
};