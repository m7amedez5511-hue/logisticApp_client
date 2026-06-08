// ─────────────────────────────────────────────
// src/lib/auth.ts
// كل عمليات الـ auth — login/logout/session
// ─────────────────────────────────────────────
import { requestJson } from "./api";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY  = "auth_user";

// ─── Types ───────────────────────────────────
export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  roleId?: string;
  userName?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ─── Session helpers ─────────────────────────
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

// ─── Login ───────────────────────────────────
// بتستخدم requestJson عشان الطلب يمر بالـ proxy
// وما يحصلش CORS من المتصفح مباشرة
type RawLoginPayload = {
  success?: boolean;
  message?: string;
  data?: { token?: string; user?: AuthUser };
  token?: string;
  user?: AuthUser;
};

type RawUser = {
  role?: {
    permissions?: Array<{ permission?: { slug?: string } }>;
  };
};

export async function loginUser(
  identity: string,
  password: string,
): Promise<LoginResponse> {
  const payload = await requestJson<RawLoginPayload>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ identity, password }),
  });

  const token = payload.data?.token ?? payload.token;
  const user  = payload.data?.user  ?? payload.user;

  if (!token || !user) {
    throw new Error("The server did not return a valid session payload.");
  }

  // استخرج الـ permissions من الـ role المُضمّن
  const rolePermissions =
    (user as unknown as RawUser).role?.permissions ?? [];

  const permissions = Array.isArray(rolePermissions)
    ? rolePermissions
        .map((entry) => entry?.permission?.slug)
        .filter((slug): slug is string => Boolean(slug))
    : [];

  const fullUser: AuthUser = { ...user, permissions };
  saveAuth(token, fullUser);

  return { token, user: fullUser };
}