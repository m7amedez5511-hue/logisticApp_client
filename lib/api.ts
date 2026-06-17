const DEFAULT_BASE_URL = "/api/proxy";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  token: string | null = null,
): Promise<T> {
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const endpoint = `${API_BASE_URL}${normalizePath(path)}`;

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch(endpoint, {
        ...init,
        headers,
        cache: "no-store",
        method: init.method || "GET",
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        const message =
          json?.message ||
          json?.error ||
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return (await response.json()) as T;
    } catch (error) {
      attempt += 1;
      if (attempt >= maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 300));
    }
  }

  throw new Error("Request failed after retries.");
}