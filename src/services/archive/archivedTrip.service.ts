import { get } from "../api";
import type { ArchivedTripListResponse, ArchivedTripResponse } from "@/src/types/trip";

/** Building a query string to fetch archived trips with pagination */
function buildArchivedQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const archivedTripService = {
  /** Fetching the archived trip list, paginated */
  getAll: (page: number, search: string, token: string | null) =>
    get<ArchivedTripListResponse>(
      `trip/archived${buildArchivedQuery(page, search)}`,
      token,
    ),

  /** Get a single archived trip by id */
  getById: (id: string, token: string | null) =>
    get<ArchivedTripResponse>(`trip/archived/${id}`, token),
  getAllUnwrapped: async (page, search, token) => {
  const res = await archivedTripService.getAll(page, search, token);
  return { items: res.data.data, total: res.data.meta.total, pages: res.data.meta.totalPages };
},
getByIdUnwrapped: async (id, token) => (await archivedTripService.getById(id, token)).data,
};