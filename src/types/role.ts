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
    premissions: { data: Permission[] };
  };
}

//permissions
export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
}

// ── Permission mutation responses ───────────────────────────────────────────

export interface RolePermissionLink {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface AssignPermissionResponse {
  success: true;
  message: string;
  responseAt: string;
  data: RolePermissionLink;
}

export interface BulkAssignPermissionsResponse {
  success: true;
  message: string;
  responseAt: string;
  data: Role;
}

export interface ApiErrorDetail {
  field: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  responseAt: string;
  error: {
    code: string;
    path: string;
    details: ApiErrorDetail[];
  };
}
// Archived role resource returned by the archive endpoints
export interface ArchivedRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /role/archived/{id}
export interface ArchivedRoleResponse {
  data: ArchivedRole;
}

// GET /role/archived — like the other archive endpoints, this returns
// { data: { data: ArchivedRole[], meta: {...} } }.
// Search & pagination are still handled client-side in the hook.
export interface ArchivedRoleListResponse {
  data: {
    data: ArchivedRole[];
    meta?: { total: number; page: number; limit: number; totalPages: number };
  };
}
export interface RoleListResult {
  items: Role[];
  total: number;
  pages: number;
}