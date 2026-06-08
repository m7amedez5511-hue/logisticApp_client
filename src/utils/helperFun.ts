// ─── fexed ───────────────────────────────────
export const SESSION_KEY    = "lf_client";
export const SESSION_COOKIE = "lf_client_id";

// ─── Types ───────────────────────────────────
export interface ClientSession {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// ─── Cookies ─────────────────────────────────
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days = 30) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

// ─── Session ─────────────────────────────────
export function loadSession(): ClientSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as ClientSession;
  } catch {}
  const id = getCookie(SESSION_COOKIE);
  if (id) return { id, name: "", email: "", phone: "" };
  return null;
}

export function saveSession(s: ClientSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  setCookie(SESSION_COOKIE, s.id);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  deleteCookie(SESSION_COOKIE);
}

// ─── Formatting ──────────────────────────────
export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtAmount(n: number) {
  return `${n.toFixed(2)} ر.س`;
}

// ─── Order Status ──────────────────────────────
export type OrderStatus = "CREATED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export function statusColor(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    CREATED:    "bg-blue-50 text-blue-700 border-blue-200",
    IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
    DELIVERED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED:  "bg-red-50 text-red-600 border-red-200",
  };
  return map[status];
}

export function statusLabel(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    CREATED:    "تم الإنشاء",
    IN_TRANSIT: "قيد التوصيل",
    DELIVERED:  "تم التسليم",
    CANCELLED:  "ملغي",
  };
  return map[status];
}