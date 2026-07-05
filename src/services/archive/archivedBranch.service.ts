import { get } from "../api";
import type {
  ArchivedBranchListResponse,
  ArchivedBranchResponse,
} from "@/src/types/branch";

/** Building a query string to fetch archived branches with pagination */
function buildArchivedQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const archivedBranchService = {
  /** Fetching the archived branch list, paginated */
  getAll: (page: number, search: string, token: string | null) =>
    get<ArchivedBranchListResponse>(
      `branches/archived${buildArchivedQuery(page, search)}`,
      token,
    ),
};