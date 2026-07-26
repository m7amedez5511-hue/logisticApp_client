import { get } from "../api";
import type {
  ArchivedDriverListResponse,
  ArchivedDriverResponse,
} from "@/src/types/driver";

/**
 * Builds the query string for the archived drivers list endpoint.
 * @param page - 1-indexed page number
 * @param search - free-text search term (name or phone), omitted if empty
 * @returns a query string starting with "?"
 */
function buildArchivedQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const archivedDriverService = {
  /**
   * Fetches the paginated list of archived drivers.
   * @param page - page number to fetch
   * @param search - optional search term
   * @param token - auth token, or null if unauthenticated
   */
  getAll: (page: number, search: string, token: string | null) =>
    get<ArchivedDriverListResponse>(
      `driver/archived${buildArchivedQuery(page, search)}`,
      token,
    ),

  /**
   * Fetches a single archived driver by id.
   * @param id - archived driver id
   * @param token - auth token, or null if unauthenticated
   */
  getById: (id: string, token: string | null) =>
    get<ArchivedDriverResponse>(`driver/archived/${id}`, token),

  getAllUnwrapped: async (page: number, search: string, token: string | null) => {
  const res = await archivedDriverService.getAll(page, search, token);
  return { items: res.data.data, total: res.data.meta.total, pages: res.data.meta.totalPages };
},
getByIdUnwrapped: async (id: string, token: string | null) => (await archivedDriverService.getById(id, token)).data,
};