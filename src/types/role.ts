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


//permissions
export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
}