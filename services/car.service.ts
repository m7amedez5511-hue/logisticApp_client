import { get, post, patch, del } from "./api";
import type {
  Car,
  CarListResponse,
  CarDetailResponse,
  CarImageListResponse,
  CreateCarPayload,
  UpdateCarPayload,
} from "../types/car";

/** Build a query string for list endpoints */
function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const carService = {
  /**
   * GET /cars
   * Fetch paginated + searchable car list.
   */
  getAll: (
    page = 1,
    search = "",
    token: string | null,
  ) =>
    get<CarListResponse>(
      `cars${buildQuery({ page, limit: 10, search: search || undefined })}`,
      token,
    ),

  /**
   * GET /cars/archived
   * Fetch soft-deleted cars.
   */
  getArchived: (token: string | null) =>
    get<CarListResponse>("cars/archived", token),

  /**
   * GET /cars/:id
   * Fetch a single car with status history.
   */
  getById: (id: string, token: string | null) =>
    get<CarDetailResponse>(`cars/${id}`, token),

  /**
   * POST /cars
   * Create a new car record.
   */
  create: (payload: CreateCarPayload, token: string | null) =>
    post<{ data: Car }>("cars", payload, token),

  /**
   * PATCH /cars/:id
   * Update an existing car's details.
   */
  update: (id: string, payload: UpdateCarPayload, token: string | null) =>
    patch<{ data: Car }>(`cars/${id}`, payload, token),

  /**
   * DELETE /cars/:id
   * Soft-delete a car (returns 204 No Content).
   */
  delete: (id: string, token: string | null) =>
    del<void>(`cars/${id}`, token),

  // ── Images ──────────────────────────────────────────────────────────────

  /**
   * GET /car-images/car/:id
   * Fetch all active images for a car.
   * Supports optional query params: day, month, year, date, sortBy.
   */
  getImages: (
    carId: string,
    token: string | null,
    filters: { day?: string; month?: string; year?: string; date?: string; sortBy?: "asc" | "desc" } = {},
  ) =>
    get<CarImageListResponse>(
      `car-images/car/${carId}${buildQuery(filters as Record<string, string>)}`,
      token,
    ),

  /**
   * GET /car-images/car/:id/archive
   * Fetch soft-deleted images for a car.
   */
  getArchivedImages: (carId: string, token: string | null) =>
    get<CarImageListResponse>(`car-images/car/${carId}/archive`, token),

  /**
   * POST /car-images/car/:id   (multipart/form-data)
   * Upload one or more images.
   * Uses raw fetch because multer expects FormData, not JSON.
   */
  uploadImages: async (
    carId: string,
    files: File[],
    stage: "BEFORE" | "AFTER" | "GENERAL" = "GENERAL",
    token: string | null,
    maintenanceId?: string,
  ): Promise<CarImageListResponse> => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    form.append("stage", stage);
    if (maintenanceId) form.append("maintenanceId", maintenanceId);

    const res = await fetch(`/api/proxy/car-images/car/${carId}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      cache: "no-store",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<CarImageListResponse>;
  },

  /**
   * DELETE /car-images/:imageId
   * Soft-delete a single image.
   */
  deleteImage: (imageId: string, token: string | null) =>
    del<void>(`car-images/${imageId}`, token),
};