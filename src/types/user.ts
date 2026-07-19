export interface User {
  id: string;
  name: string;
  userName?: string;
  email?: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  role?: { id?: string; name: string } | null;
  branch?: { id?: string; name: string } | null;
}
export interface UserResponse {
  data: User;
}
export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  branchId: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  roleId?: string;
  branchId?: string;
}

export interface ApiListResponse<T> {
  data: {
    data: T[];
    pagination: { total: number; page: number; pages: number ;  };
    meta?: { total: number; pages: number };
  };
}

export type TableState = {
  users: User[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
};

export type TableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; users: User[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD"; user: User }
  | { type: "UPDATE"; user: User }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };


  export interface UserDetail extends User {
  photo: string | null;
  refreshToken: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  updatedAt: string;
  passwordChangedAt: string | null;
  role: { id?: string; name: string; description?: string };
  branch: { id?: string; name: string };
}

// Archived user resource returned by the archive endpoints
export interface ArchivedUser {
  id: string;
  name: string;
  userName?: string;
  email?: string;
  phone: string;
  photo: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /v1/users/archived/{id}
export interface ArchivedUserResponse {
  data: ArchivedUser;
}

// GET /v1/users/archived  (note: this endpoint uses `meta`, not `pagination`,
// unlike the live users list — kept as a distinct shape rather than reusing
// ApiListResponse<T> from user.ts)
export interface ArchivedUserListResponse {
  data: {
    data: ArchivedUser[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// Shared API error shape (validation_failed etc.)
export interface ApiErrorResponse {
  success: false;
  message: string;
  responseAt: string;
  error: {
    code: string;
    path: string;
    details: { field: string; code: string }[];
  };
}

export interface Permission {
  name: string;
  slug: string;
  module: string;
}

export interface RolePermissionEntry {
  permission: Permission;
}

export interface UserRoleDetail {
  name: string;
  description?: string;
  permissions?: RolePermissionEntry[];
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface UserMe extends User {
  photo: string | null;
  isDeleted: boolean;
  updatedAt: string;
  role?: UserRoleDetail | null;
  branch?: { id?: string; name: string } | null;
}
export interface UserListResult {
  items: User[];
  total: number;
  pages: number;
}