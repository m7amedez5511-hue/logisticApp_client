export interface User {
  id: string;
  name: string;
  userName?: string;
  email?: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  role?: { id?: string; name: string };
  branch?: { id?: string; name: string };
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