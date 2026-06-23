import { authService } from "@/src/services/auth.service";
import type { AuthUser } from "@/src/types/auth";

const AUTH_TOKEN_KEY    = "auth_token";
const AUTH_USER_KEY     = "auth_user";
const AUTH_TOKEN_COOKIE = "auth_token";

// ── Cookie helpers ─────────────────────────────────────────────────────────
function setTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + 7 * 864e5).toUTCString();
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; expires=${exp}; path=/; SameSite=Lax`;
}

function deleteTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

// ── Storage ────────────────────────────────────────────────────────────────
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  setTokenCookie(token);
}

/**
 * Clear auth state: removes localStorage keys, calls /api/clear-cookie to
 * remove the HttpOnly cookie (only the server can delete an HttpOnly cookie).
 */
export async function clearAuth(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    deleteTokenCookie();
  }
  try {
    await fetch("/api/clear-cookie", { method: "POST", cache: "no-store" });
  } catch {
    // Best-effort — if the network call fails the cookie will expire on its own
  }
}

// ── Blocked roles ──────────────────────────────────────────────────────────
const BLOCKED_ROLES = ["driver", "سائق"] as const;

// ── Login ──────────────────────────────────────────────────────────────────
type RawRole = { name?: string; permissions?: Array<{ permission?: { slug?: string } }> } | string;

export async function loginUser(identity: string, password: string) {
  const payload = await authService.login({ identity, password });

  const { token, user } = payload.data || {};
  if (!token || !user) {
    throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة.");
  }

  const rawRole  = (user as unknown as { role?: RawRole }).role;
  const roleName = typeof rawRole === "string"
    ? rawRole
    : typeof rawRole === "object" && rawRole !== null
      ? rawRole.name
      : undefined;

  if (roleName && (BLOCKED_ROLES as readonly string[]).includes(roleName)) {
    throw new Error("غير مصرح لك بالوصول إلى هذه اللوحة.");
  }

  const rolePermissions =
    typeof rawRole === "object" && rawRole !== null
      ? (rawRole as Exclude<RawRole, string>).permissions ?? []
      : [];

  const permissions = Array.isArray(rolePermissions)
    ? rolePermissions
        .map(e => e?.permission?.slug)
        .filter((s): s is string => Boolean(s))
    : [];

  // Store HttpOnly cookie via server endpoint
  try {
    await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Non-fatal — middleware will still work if cookie was already set
  }

  const fullUser: AuthUser = { ...user, role: roleName, permissions };
  saveAuth(token, fullUser);
  return { token, user: fullUser };
}