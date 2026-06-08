import { requestJson } from "./api";

const AUTH_TOKEN_KEY    = "auth_token";
const AUTH_USER_KEY     = "auth_user";
const AUTH_TOKEN_COOKIE = "auth_token"; // cookie name must match what the server expects (e.g., in middleware)

// ─── Cookie helpers ───────────────────────────
function setTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + 7 * 864e5).toUTCString(); // 7 أيام
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; expires=${exp}; path=/; SameSite=Lax`;
}

function deleteTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

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

// ─── Storage ─────────────────────────────────
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
  //save in localStorage for client-side access
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  // save in cookie for server-side access (e.g., in middleware)
  setTokenCookie(token);
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  deleteTokenCookie();
}

// ─── Blocked Roles ────────────────────────────
const BLOCKED_ROLES = ["driver", "سائق"] as const;

type RawLoginPayload = {
  success?: boolean;
  message?: string;
  data?: { token?: string; user?: AuthUser };
  token?: string;
  user?: AuthUser;
};

type RawUser = {
  role?: {
    name?: string;
    permissions?: Array<{ permission?: { slug?: string } }>;
  } | string;
};

// ─── Login ────────────────────────────────────
export async function loginUser(
  identity: string,
  password: string,
): Promise<LoginResponse> {
  const payload = await requestJson<RawLoginPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identity, password }),
  });
  console.log("Login response payload:", payload);

  const token = payload.data?.token ?? payload.token;
  const user  = payload.data?.user  ?? payload.user;

  if (!token || !user) {
    throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة.");
  }

  // destracture role from user and determine roleName
  const rawRole = (user as unknown as RawUser).role;
  const roleName: string | undefined =
    typeof rawRole === "string"
      ? rawRole
      : typeof rawRole === "object" && rawRole !== null
        ? rawRole.name
        : undefined;

  // reject if role is in blocked list
  if (roleName && (BLOCKED_ROLES as readonly string[]).includes(roleName)) {
    throw new Error("غير مصرح لك بالوصول إلى هذه اللوحة.");
  }

  //fetch permissions
  const rolePermissions =
    typeof rawRole === "object" && rawRole !== null
      ? rawRole.permissions ?? []
      : [];

  const permissions = Array.isArray(rolePermissions)
    ? rolePermissions
        .map((entry) => entry?.permission?.slug)
        .filter((slug): slug is string => Boolean(slug))
    : [];

  const fullUser: AuthUser = { ...user, role: roleName, permissions };

  // save auth data in both localStorage and cookie for client and server access
  saveAuth(token, fullUser);

  return { token, user: fullUser };
}