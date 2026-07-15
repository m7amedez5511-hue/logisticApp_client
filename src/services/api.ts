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

// ── Sensitive-field redaction ─────────────────────────────────────────
// Keys matched case-insensitively; extend this list as new sensitive
// fields are introduced (e.g. new auth flows, payment fields, etc).
const SENSITIVE_KEYS = ["password", "token", "secret", "authorization", "refreshtoken"];

function redactSensitiveFields(value: unknown): unknown {
  if (value instanceof FormData) return "[FormData]";

  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return value; // not JSON — nothing structured to redact
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item) => redactSensitiveFields(JSON.stringify(item)));
  }

  if (parsed && typeof parsed === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        redacted[key] = "[REDACTED]";
      } else if (val && typeof val === "object") {
        redacted[key] = redactSensitiveFields(JSON.stringify(val));
      } else {
        redacted[key] = val;
      }
    }
    return redacted;
  }

  return parsed;
}

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

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("API request:", {
      url,
      method: init.method ?? "GET",
      body: redactSensitiveFields(init.body),
    });
  }
  

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
    method: init.method ?? "GET",
  });

  if (!res.ok) {
    // Try to parse JSON body for a helpful message. In dev, log the
    // full response body to make debugging backend validation errors
    // easier (the browser Network tab also shows this).
    const text = await res.text().catch(() => null);
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    const message: string = json?.message ?? json?.error ?? `HTTP ${res.status}: ${res.statusText}`;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("API request failed:", { url, status: res.status, body: json ?? text });
    }
    throw new ApiError(res.status, message);
  }

  //return res.json() as Promise<T>;
const text = await res.text();
return (text && text.trim().length > 0 ? JSON.parse(text) : null) as T;
}

// ── Convenience shorthands ────────────────────────────
export const get = <T>(path: string, token?: string | null) =>
  request<T>(path, {}, token);

export const post = <T>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) }, token);

export const patch = <T>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, token);
export const put = <T>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) }, token);

export const del = <T>(path: string, token?: string | null) =>
  request<T>(path, { method: "DELETE" }, token);


