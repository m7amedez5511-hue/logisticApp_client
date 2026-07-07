export interface User {
  id?: string;
  name?: string;
  userName?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  roleId?: string;
  [key: string]: unknown;
}

export type AuthUser = User;

export interface LoginRequest {
  userName?: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginPayload {
  identity: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  data?: {
    token?: string;
    user?: User;
  };
}