import { get } from "../api";
import type {
  ArchivedRoleListResponse,
  ArchivedRoleResponse,
} from "@/src/types/role";

export const archivedRoleService = {
  /** Fetching the full archived role list — API returns a plain array,
   *  no server-side pagination/search, unlike users/branches archives. */
  getAll: (token: string | null) =>
    get<ArchivedRoleListResponse>("role/archived", token),

  /** Get a single archived role by id */
  getById: (id: string, token: string | null) =>
    get<ArchivedRoleResponse>(`role/archived/${id}`, token),

  // NOTE: delete/restore intentionally left out for now — mirrors the
  // archivedUser.service.ts / archivedBranch.service.ts follow-up ticket.
};