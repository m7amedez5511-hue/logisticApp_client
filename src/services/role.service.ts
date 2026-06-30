import {
  ApiPaginatedResponse,
  AssignPermissionResponse,
  BulkAssignPermissionsResponse,
  PermissionsResponse,
  Role,
  RoleFormData,
  RoleResponse,
} from "../types/role";
import { get, post, put, del, patch } from "./api";

/** Build query string for paginated role listing */
function buildRolesQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const roleService = {
  /** Fetch paginated roles list */
  getAll: (page: number, search: string, token: string | null) =>
    get<ApiPaginatedResponse<Role>>(`role${buildRolesQuery(page, search)}`, token),

  /** Fetch a single role by ID (includes permissions) */
  getById: (id: string, token: string | null) =>
    get<{ data: Role }>(`role/${id}`, token),

  /** Create a new role */
  create: (data: RoleFormData, token: string | null) =>
    post<RoleResponse>("role", { name: data.name, description: data.description }, token),

  /** Update role name/description */
  update: (id: string, data: Partial<RoleFormData>, token: string | null) =>
    put<RoleResponse>(`role/${id}`, { name: data.name, description: data.description }, token),

  /** Soft-delete a role */
  delete: (id: string, token: string | null) =>
    del<void>(`role/${id}`, token),

  /** Fetch all available permissions for checkbox list */
  getPermissions: (token: string | null) =>
    get<PermissionsResponse>("premission?limit=200", token),

  /** POST /role/{id}/permissions — assign a single permission to a role */
  assignPermission: (roleId: string, permissionId: string, token: string | null) =>
    post<AssignPermissionResponse>(`role-permissions/${roleId}/permissions`, { permissionId }, token),

  /** PATCH /role/{id}/permissions/bulk — replace all permissions for a role */
  bulkAssignPermissions: (roleId: string, permissionIds: string[], token: string | null) =>
    patch<BulkAssignPermissionsResponse>(`role-permissions/${roleId}/permissions`, { permissionIds }, token),

  /** DELETE /role/{id}/permissions/{permissionId} — remove a single permission */
  removePermission: (roleId: string, permissionId: string, token: string | null) =>
    del<void>(`role-permissions/${roleId}/permissions/${permissionId}`, token),
};