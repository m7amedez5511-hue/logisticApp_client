const DEFAULT_BASE_URL = "/api/proxy";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

// ─── API REQUESTS ─────────────────────────────
export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

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
        // try to parse error message from response, fallback to status text
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
      // exponential back-off: 600ms, 1200ms
      await new Promise((resolve) =>
        setTimeout(resolve, 2 ** attempt * 300),
      );
    }
  }

  throw new Error("Request failed after retries.");
}

// ─── Types ───────────────────────────────────
export type DashboardSummaryResponse = {
  success: boolean;
  message: string;
  data: {
    stats: {
      clients: number;
      orders: number;
      trips: number;
      cars: number;
      drivers: number;
    };
    alerts: {
      expiringCars: Array<Record<string, unknown>>;
      expiringDrivers: Array<Record<string, unknown>>;
      upcomingMaint: Array<Record<string, unknown>>;
    };
    activeTrips: Array<{
      id: string;
      tripNumber: string;
      title: string;
      progress: number;
    }>;
    accountSecurity: {
      lastLogin: string | null;
      requestMeta: Record<string, unknown> | null;
    };
  };
};

// ─── API calls ───────────────────────────────
export async function getDashboardSummary() {
  return requestJson<DashboardSummaryResponse>("/dashboard/summary");
}

export async function getHealth() {
  return requestJson<{ status: string; message: string }>("/health");
}