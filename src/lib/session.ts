export const SESSION_KEY    = "lf_client";
export const SESSION_COOKIE = "lf_client_id";

export interface ClientSession {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// ── Cookie helpers ────────────────────────────────────
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days = 30) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

// ── Session read / write ──────────────────────────────
export function loadSession(): ClientSession | null {
  try {
    const raw = typeof localStorage !== "undefined"
      ? localStorage.getItem(SESSION_KEY)
      : null;
    if (raw) return JSON.parse(raw) as ClientSession;
  } catch { /* ignore parse errors */ }

  const id = getCookie(SESSION_COOKIE);
  if (id) return { id, name: "", email: "", phone: "" };
  return null;
}

export function saveSession(s: ClientSession) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }
  setCookie(SESSION_COOKIE, s.id);
}

export function clearSession() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
  deleteCookie(SESSION_COOKIE);
}