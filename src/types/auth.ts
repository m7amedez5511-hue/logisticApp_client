export interface AuthUser {
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

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
export interface LoginPayload {
  identity: string;
  password: string;
}