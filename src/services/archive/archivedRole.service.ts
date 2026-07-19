import { get } from "../api";
import type {
  ArchivedRole,
  ArchivedRoleListResponse,
  ArchivedRoleResponse,
} from "@/src/types/role";

export const archivedRoleService = {
  getAll: (token: string | null) => get<ArchivedRoleListResponse>("role/archived", token),

  getAllUnwrapped: async (token: string | null): Promise<ArchivedRole[]> => {
    const res = await archivedRoleService.getAll(token);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  getById: (id: string, token: string | null) =>
    get<ArchivedRoleResponse>(`role/archived/${id}`, token),

  getByIdUnwrapped: async (id: string, token: string | null): Promise<ArchivedRole> =>
    (await archivedRoleService.getById(id, token)).data,
};