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
   *
   * Example response:
   * { "data": { "data": [ { "id": "...", "reason": "تغيير زيت", "cost": 150, ... } ] } }
   */
  getAll: (carId: string, token: string | null) =>
    get<MaintenanceListResponse>(`cars/${carId}/maintenance`, token),

  /**
   * GET /cars/:carId/maintenance/:maintenanceId
   * Fetch a single maintenance record with full details.
   */
  getById: (carId: string, maintenanceId: string, token: string | null) =>
    get<MaintenanceDetailResponse>(`cars/${carId}/maintenance/${maintenanceId}`, token),

  /**
   * POST /cars/:carId/maintenance
   * Create a new maintenance record for a car.
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
   */
  delete: (carId: string, maintenanceId: string, token: string | null) =>
    del<void>(`cars/${carId}/maintenance/${maintenanceId}`, token),

  /**
   * GET /cars/:carId/maintenance/archived
   * Fetch soft-deleted maintenance records for a car — mirrors the car
   * module's archive pattern in case the backend exposes the same route.
   */
  getArchived: (carId: string, token: string | null) =>
    get<MaintenanceListResponse>(`cars/${carId}/maintenance/archived`, token),
};

// Re-exported so callers can build extra filters (day/month/year, search…)
// the same way carService does, without duplicating the helper.
export { buildQuery as buildMaintenanceQuery };