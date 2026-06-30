import { get } from "../api";
import type {
  ArchivedUserListResponse,
  ArchivedUserResponse,
} from "@/src/types/user";

/** Building a query string to fetch archived users with pagination */
function buildArchivedQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const archivedUserService = {
  /** Fetching the archived user list, paginated */
  getAll: (page: number, search: string, token: string | null) =>
    get<ArchivedUserListResponse>(
      `users/archived${buildArchivedQuery(page, search)}`,
      token,
    ),

  /** Get a single archived user by id */
  getById: (id: string, token: string | null) =>
    get<ArchivedUserResponse>(`users/archived/${id}`, token),

  // NOTE: delete/restore intentionally left out for now — see ticket follow-up.
};