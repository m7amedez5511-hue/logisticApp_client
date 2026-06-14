// services/driver.service.ts
// All API calls for the Driver module.
// Endpoints extracted from:
//   - src/routes/driver.route.js      → /api/v1/driver/...
//   - src/routes/driver_report.route.js → /api/v1/drivers/:id/reports/daily

import { get, post, put, del } from "./api";
import type {
  Driver,
  DriverListResponse,
  DriverDetailResponse,
  DriverReportResponse,
  CreateDriverPayload,
  UpdateDriverPayload,
} from "../types/driver";

/** Build a query string for list endpoints */
function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (!entries.length) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

export const driverService = {
  /**
   * GET /driver
   * Fetch paginated + searchable driver list.
   * Requires: "read-driver" permission
   */
  getAll: (page = 1, search = "", token: string | null) =>
    get<DriverListResponse>(
      `driver${buildQuery({ page, limit: 12, search: search || undefined })}`,
      token,
    ),

  /**
   * GET /driver/archived
   * Fetch soft-deleted (archived) drivers.
   * Requires: "read-deleted-driver" permission
   */
  getArchived: (token: string | null) =>
    get<DriverListResponse>("driver/archived", token),

  /**
   * GET /driver/me
   * Fetch the currently authenticated driver's info.
   * Requires: "read-driver" permission
   */
  getMe: (token: string | null) =>
    get<DriverDetailResponse>("driver/me", token),

  /**
   * GET /driver/:id
   * Fetch a single driver with status history and branch info.
   * Requires: "read-driver" permission
   */
  getById: (id: string, token: string | null) =>
    get<DriverDetailResponse>(`driver/${id}`, token),

  /**
   * POST /driver
   * Create a new driver (also generates a random userName & password).
   * Requires: "create-driver" permission
   * Note: for file uploads (photo / nationalPhoto / driverCardPhoto) use uploadWithImages.
   */
  create: (payload: CreateDriverPayload, token: string | null) =>
    post<{ data: Driver }>("driver", payload, token),

  /**
   * PATCH /driver/:id
   * Update driver data or status.
   * Requires: "update-driver" permission
   */
  update: (id: string, payload: UpdateDriverPayload, token: string | null) =>
    put<{ data: Driver }>(`driver/${id}`, payload, token),

  /**
   * DELETE /driver/:id
   * Soft-delete a driver.
   * Requires: "delete-driver" permission
   */
  delete: (id: string, token: string | null) =>
    del<void>(`driver/${id}`, token),

  // ── Reports ───────────────────────────────────────────────────────────────

  /**
   * GET /driver/:id/reports/daily?date=YYYY-MM-DD
   * Generate an HTML daily report for a driver on a specific date.
   * Returns { reportUrl, filename }
   * Requires: "generate-driver-report" permission
   */
  getDailyReport: (id: string, date: string, token: string | null) =>
    get<DriverReportResponse>(
      `driver/${id}/reports/daily?date=${encodeURIComponent(date)}`,
      token,
    ),

  // ── Image upload (multipart) ──────────────────────────────────────────────

  /**
   * POST /driver  (multipart/form-data)
   * Create a driver with photos attached.
   * photo / nationalPhoto / driverCardPhoto are optional file fields.
   */
  createWithImages: async (
    payload: CreateDriverPayload & {
      photo?: File;
      nationalPhoto?: File;
      driverCardPhoto?: File;
    },
    token: string | null,
  ): Promise<{ data: Driver }> => {
    const form = new FormData();

    // Text fields
    Object.entries(payload).forEach(([key, val]) => {
      if (
        val !== undefined &&
        val !== null &&
        !(val instanceof File)
      ) {
        form.append(key, String(val));
      }
    });

    // File fields
    if (payload.photo)         form.append("photo",         payload.photo);
    if (payload.nationalPhoto) form.append("nationalPhoto", payload.nationalPhoto);
    if (payload.driverCardPhoto) form.append("driverCardPhoto", payload.driverCardPhoto);

    const res = await fetch("/api/proxy/driver", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      cache: "no-store",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ data: Driver }>;
  },
};