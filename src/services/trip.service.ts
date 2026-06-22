import { get, post, patch, del } from "./api";
import type {
  Trip,
  TripListResponse,
  TripDetailResponse,
  TripReportResponse,
  CreateTripPayload,
  UpdateTripPayload,
  TripListParams,
} from "@/src/types/trip";

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

export const tripService = {
  /**
   * GET /trip
   * Fetch paginated + filterable + searchable trip list.
   * Requires: "read-trip" permission
   */
  getAll: (params: TripListParams = {}, token: string | null) =>
    get<TripListResponse>(`trip${buildQuery({ ...params })}`, token),

  /**
   * GET /trip/archived
   * Fetch soft-deleted (archived) trips. Same filters as getAll.
   * Requires: "read-deleted-trip" permission
   */
  getArchived: (params: TripListParams = {}, token: string | null) =>
    get<TripListResponse>(`trip/archived${buildQuery({ ...params })}`, token),

  /**
   * GET /trip/archived/:id
   * Fetch a single archived trip with full details.
   * Requires: "read-deleted-trip" permission
   */
  getArchivedById: (id: string, token: string | null) =>
    get<TripDetailResponse>(`trip/archived/${id}`, token),

  /**
   * GET /trip/:id
   * Fetch a single trip with full driver/car details.
   * Requires: "read-trip" permission
   */
  getById: (id: string, token: string | null) =>
    get<TripDetailResponse>(`trip/${id}`, token),

  /**
   * POST /trip
   * Create a new trip.
   * Side effect: driver & car flip to status "InTrip" automatically.
   * Requires: "create-trip" permission
   */
  create: (payload: CreateTripPayload, token: string | null) =>
    post<{ data: Trip }>("trip", payload, token),

  /**
   * PATCH /trip/:id
   * Update trip data / status / reassign driver or car.
   * Side effects:
   *  - changing driverId: old driver -> Active, new driver -> InTrip
   *  - changing carId: same logic for cars
   *  - status Completed/Cancelled: driver & car both -> Active
   * Requires: "update-trip" permission
   */
  update: (id: string, payload: UpdateTripPayload, token: string | null) =>
    patch<{ data: Trip }>(`trip/${id}`, payload, token),

  /**
   * DELETE /trip/:id
   * Soft-delete a trip (isDeleted=true, deletedAt=now()). 204 No Content.
   * Requires: "delete-trip" permission
   */
  delete: (id: string, token: string | null) =>
    del<void>(`trip/${id}`, token),

  // ── Reports ───────────────────────────────────────────────────────────────

  /**
   * GET /trip/:id/reports
   * Generate the Trip Manifest report (HTML, saved server-side).
   * Returns { reportUrl }
   * Requires: "generate-trip-report" permission
   */
  getReport: (id: string, token: string | null) =>
    get<TripReportResponse>(`trip/${id}/reports`, token),

  /**
   * GET /trip/:id/reports/client/:clientId
   * Generate a client-filtered version of the trip report.
   * Returns { reportUrl }
   * Requires: "generate-trip-report" permission
   */
  getClientReport: (id: string, clientId: string, token: string | null) =>
    get<TripReportResponse>(`trip/${id}/reports/client/${clientId}`, token),
};