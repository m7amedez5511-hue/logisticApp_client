import { authService } from "@/src/services/auth.service";
import type { AuthUser, LoginRequest } from "@/src/types/auth";
import { detectIdentityField } from "@/src/validations/auth.validator";

const AUTH_TOKEN_KEY    = "auth_token";
const AUTH_USER_KEY     = "auth_user";
const AUTH_TOKEN_COOKIE = "auth_token";

function normalizeUser(user: AuthUser | null | undefined): AuthUser | null {
  if (!user) return null;

  const rawRole = (user as unknown as { role?: unknown }).role;
  const roleName = typeof rawRole === "string"
    ? rawRole
    : typeof rawRole === "object" && rawRole !== null && "name" in rawRole && typeof (rawRole as { name?: unknown }).name === "string"
      ? (rawRole as { name: string }).name
      : undefined;

  const rawPermissions = Array.isArray((user as unknown as { permissions?: unknown[] }).permissions)
    ? (user as unknown as { permissions?: unknown[] }).permissions
    : typeof rawRole === "object" && rawRole !== null && "permissions" in rawRole
      ? ((rawRole as { permissions?: unknown[] }).permissions ?? [])
      : [];

  const permissions = Array.isArray(rawPermissions)
    ? rawPermissions
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object") {
            if ("slug" in entry && typeof (entry as { slug?: unknown }).slug === "string") {
              return (entry as { slug: string }).slug;
            }
            if ("permission" in entry && entry.permission && typeof (entry.permission as { slug?: unknown }).slug === "string") {
              return (entry.permission as { slug: string }).slug;
            }
          }
          return null;
        })
        .filter((entry): entry is string => Boolean(entry))
    : [];

  return { ...user, role: roleName, permissions };
}

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
  try { return normalizeUser(JSON.parse(raw) as AuthUser); } catch { return null; }
}

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  const normalizedUser = normalizeUser(user);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));
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
  // FIX (Problem 2): build a proper LoginRequest — the backend expects one
  // specific typed field (email | phone | userName), not a generic
  // `identity` string. This is the same detection useAuth.ts already uses,
  // so both call sites now agree on one contract instead of two.
  const field = detectIdentityField(identity);
  if (!field) {
    throw new Error(
      "يجب إدخال بريد إلكتروني صحيح أو رقم هاتف سعودي صحيح أو اسم مستخدم لا يقل عن حرفين.",
    );
  }

  const payload: LoginRequest = { password };
  payload[field] = identity;

  const response = await authService.login(payload);

  // Response may arrive already-unwrapped or nested under `data`, depending
  // on the fetch wrapper — normalize both shapes, same as useAuth.ts.
  const envelope = (response as { data?: { data?: { token?: string; user?: AuthUser }; token?: string; user?: AuthUser } }).data ?? response;
  const body = (envelope as { data?: { token?: string; user?: AuthUser }; token?: string; user?: AuthUser }).data ?? envelope;
  const token = body?.token;
  const user  = body?.user;

  if (!token || !user) {
    throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة.");
  }

  const rawRole  = (user as unknown as { role?: RawRole }).role;
  const roleName = typeof rawRole === "string"
    ? rawRole
    : typeof rawRole === "object" && rawRole !== null
      ? rawRole.name
      : undefined;

  // FIX (Problem 1): this now actually executes — loginUser() is type-correct
  // and reachable, so a blocked role is rejected here, before any token or
  // cookie is ever stored, instead of relying solely on the middleware's
  // after-the-fact redirect to /forbidden.
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

  // Store HttpOnly cookie via server endpoint (only the server can set HttpOnly)
  try {
    await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Non-fatal for the JS-visible session (saveAuth() below still sets a
    // readable cookie middleware can fall back to), but the HttpOnly cookie
    // that middleware normally prefers won't be set — log it so it's visible.
    console.warn("loginUser: failed to persist HttpOnly auth cookie.");
  }

  const fullUser: AuthUser = { ...user, role: roleName, permissions };
  saveAuth(token, fullUser);
  return { token, user: fullUser };
}