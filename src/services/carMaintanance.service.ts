import { get, post, patch, del } from "./api";
import type {
  CarMaintenance,
  MaintenanceListResponse,
  MaintenanceDetailResponse,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from "@/src/types/carMaintanance";

/** Build a query string for list endpoints — skips empty values. */
function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const carMaintenanceService = {
  /**
   * GET /cars/:carId/maintenance
   * Fetch every maintenance record that belongs to one car.
   * NOTE: backend does NOT support pagination on this endpoint — confirmed
   * against a live response, which returns the full array under `data`
   * with no `pagination`/`meta` block. Capped client-side to avoid
   * rendering/sorting an unbounded list in the UI.
   *
   * Example response:
   * { "success": true, "message": "...", "responseAt": "...",
   *   "data": [ { "id": "...", "reason": "تشحيم", "cost": "30", ... } ] }
   */
  getAll: async (carId: string, token: string | null): Promise<MaintenanceListResponse> => {
    const MAX_RECORDS = 100;
    const res = await get<MaintenanceListResponse>(`cars/${carId}/maintenance`, token);
    if (res.data.length > MAX_RECORDS) {
      return { ...res, data: res.data.slice(0, MAX_RECORDS) };
    }
    return res;
  },

  /**
   * GET /cars/:carId/maintenance/:maintenanceId
   * Fetch a single maintenance record with full details.
   */
  getById: (carId: string, maintenanceId: string, token: string | null) =>
    get<MaintenanceDetailResponse>(`cars/${carId}/maintenance/${maintenanceId}`, token),

  /**
   * POST /cars/:carId/maintenance
   * Create a new maintenance record for a car.
   * NOTE: this is the ONLY way a car's status can move to "InMaintenance" —
   * there is no direct car-status edit anywhere in the frontend anymore.
   *
   * Example request body:
   * { "reason": "تغيير زيت", "cost": 150, "startAt": "2026-01-10T00:00:00.000Z" }
   */
  create: (carId: string, payload: CreateMaintenancePayload, token: string | null) =>
    post<{ data: CarMaintenance }>(`cars/${carId}/maintenance`, payload, token),

  /**
   * PATCH /cars/:carId/maintenance/:maintenanceId
   * Update an existing maintenance record (for example, closing it out
   * by setting an endAt date, or correcting the cost).
   */
  update: (
    carId: string,
    maintenanceId: string,
    payload: UpdateMaintenancePayload,
    token: string | null,
  ) =>
    patch<{ data: CarMaintenance }>(
      `cars/${carId}/maintenance/${maintenanceId}`,
      payload,
      token,
    ),

  /**
   * DELETE /cars/:carId/maintenance/:maintenanceId
   * Soft-delete a maintenance record (returns 204 No Content).
   * NOTE: backend reverts the car's status to "Active" and logs the
   * transition in CarStatusHistory as a side effect of this call.
   */
  delete: (carId: string, maintenanceId: string, token: string | null) =>
    del<void>(`cars/${carId}/maintenance/${maintenanceId}`, token),

  /**
   * GET /cars/:carId/maintenance/archived
   * Fetch soft-deleted maintenance records for a single car.
   */
  getArchived: (carId: string, token: string | null) =>
    get<MaintenanceListResponse>(`cars/${carId}/maintenance/archived`, token),

  /**
   * GET /maintenance/archived
   * Fetch every soft-deleted maintenance record system-wide (not scoped to
   * one car). Used by an admin/audit view rather than the per-car panel.
   */
  getAllArchivedGlobal: (token: string | null) =>
    get<MaintenanceListResponse>("maintenance/archived", token),

  getAllUnwrapped: async (carId: string, token: string | null): Promise<CarMaintenance[]> => {
    const res = await carMaintenanceService.getAll(carId, token);
    return res.data;
  },

  getArchivedUnwrapped: async (carId: string, token: string | null): Promise<CarMaintenance[]> => {
    const res = await carMaintenanceService.getArchived(carId, token);
    return res.data;
  },
};


// Re-exported so callers can build extra filters (day/month/year, search…)
// the same way carService does, without duplicating the helper.
export { buildQuery as buildMaintenanceQuery };