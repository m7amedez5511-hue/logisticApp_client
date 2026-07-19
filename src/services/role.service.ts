import {
  ApiPaginatedResponse, AssignPermissionResponse, BulkAssignPermissionsResponse,
  PermissionsResponse, Permission, Role, RoleFormData, RoleResponse, RoleListResult,
} from "../types/role";
import { get, post, put, del, patch } from "./api";

function buildRolesQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const roleService = {
  getAll: async (page: number, search: string, token: string | null): Promise<RoleListResult> => {
    const res: ApiPaginatedResponse<Role> = await get<ApiPaginatedResponse<Role>>(
      `role${buildRolesQuery(page, search)}`,
      token,
    );
    return {
      items: res.data.data,
      total: res.data.meta?.total ?? res.data.pagination?.total ?? 0,
      pages: res.data.meta?.pages ?? res.data.pagination?.pages ?? 1,
    };
  },

  getById: async (id: string, token: string | null): Promise<Role> => {
    const res = await get<{ data: Role }>(`role/${id}`, token);
    return res.data;
  },

  create: async (data: RoleFormData, token: string | null): Promise<Role> => {
    const res: RoleResponse = await post<RoleResponse>(
      "role", { name: data.name, description: data.description }, token,
    );
    return res.data;
  },

  update: async (id: string, data: Partial<RoleFormData>, token: string | null): Promise<Role> => {
    const res: RoleResponse = await put<RoleResponse>(
      `role/${id}`, { name: data.name, description: data.description }, token,
    );
    return res.data;
  },

  delete: (id: string, token: string | null) => del<void>(`role/${id}`, token),

  getPermissions: async (token: string | null): Promise<Permission[]> => {
    const res: PermissionsResponse = await get<PermissionsResponse>("premission?limit=200", token);
    return  res.data?.premissions?.data ?? [];
  },

  assignPermission: (roleId: string, permissionId: string, token: string | null) =>
    post<AssignPermissionResponse>(`role-permissions/${roleId}/permissions`, { permissionId }, token),

  bulkAssignPermissions: (roleId: string, permissionIds: string[], token: string | null) =>
    patch<BulkAssignPermissionsResponse>(`role-permissions/${roleId}/permissions`, { permissionIds }, token),

  removePermission: (roleId: string, permissionId: string, token: string | null) =>
    del<void>(`role-permissions/${roleId}/permissions/${permissionId}`, token),
};