import { requestJson } from "@/lib/api";
import { get, post, put, del, patch } from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  permissions?: Array<{
    permission: Permission;
  }>;
}

export interface RoleFormData {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface ApiPaginatedResponse<T> {
  data: {
    data: T[];
    pagination?: { total: number; page: number; pages: number };
    meta?: { total: number; pages: number };
  };
}

export interface RoleResponse {
  data: Role;
}

export interface PermissionsResponse {
  data: {
    premissions: Permission[];
  };
}

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

  /** Assign a single permission to a role */
  assignPermission: (roleId: string, permissionId: string, token: string | null) =>
    post<unknown>(`role/${roleId}/permissions`, { permissionId }, token),

  /** Remove a permission from a role */
  removePermission: (roleId: string, permissionId: string, token: string | null) =>
    del<unknown>(`role/${roleId}/permissions/${permissionId}`, token),
  /** Atomically replace all permissions assigned to a role */
  setPermissions: (roleId: string, permissionIds: string[], token: string | null) =>
    patch<{ data: Role }>(`role/${roleId}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ permissionIds }),
    }, token),
  
};
