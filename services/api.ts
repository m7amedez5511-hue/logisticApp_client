// Base HTTP helper — no React, no UI imports.
// All network calls in the app ultimately call `request()` from here.

/** Resolved at runtime: server-side reads INTERNAL_API_BASE_URL,
 *  browser always hits the Next.js proxy to avoid CORS. */
function resolveBase() {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_BASE_URL ?? "";
  }
  return "/api/proxy";
}

// ── Error type ─────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core request helper ────────────────────────────────
export async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${resolveBase()}/${path.replace(/^\/+/, "")}`;

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
    method: init.method ?? "GET",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message: string =
      json?.message ?? json?.error ?? `HTTP ${res.status}: ${res.statusText}`;
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

// ── Convenience shorthands ────────────────────────────
export const get  = <T>(path: string, token?: string | null) =>
  request<T>(path, {}, token);

export const post = <T>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) }, token);

export const put  = <T>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, { method: "PUT",  body: JSON.stringify(body) }, token);

export const del  = <T>(path: string, token?: string | null) =>
  request<T>(path, { method: "DELETE" }, token);