import { get, post, patch, del } from "./api";
import type {
  Car, CarImage, CarListResponse, CarDetailResponse, CarImageListResponse,
  CarListResult, CarOption, CreateCarPayload, UpdateCarPayload,
} from "@/src/types/car";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const carService = {
  getAll: async (page = 1, search = "", token: string | null): Promise<CarListResult> => {
    const res: CarListResponse = await get<CarListResponse>(
      `cars${buildQuery({ page, limit: 10, search: search || undefined })}`,
      token,
    );
    return {
      items: res.data.data,
      total: res.data.meta?.total ?? res.data.pagination?.total ?? 0,
      pages: res.data.meta?.pages ?? res.data.pagination?.pages ?? 1,
    };
  },

  getArchived: async (token: string | null): Promise<Car[]> => {
    const res: CarListResponse = await get<CarListResponse>("cars/archived", token);
    return res.data.data;
  },

  getById: async (id: string, token: string | null): Promise<Car> => {
    const res: CarDetailResponse = await get<CarDetailResponse>(`cars/${id}`, token);
    return res.data;
  },

  create: async (payload: CreateCarPayload, token: string | null): Promise<Car> => {
    const res = await post<{ data: Car }>("cars", payload, token);
    return res.data;
  },

  update: async (id: string, payload: UpdateCarPayload, token: string | null): Promise<Car> => {
    const res = await patch<{ data: Car }>(`cars/${id}`, payload, token);
    return res.data;
  },

  delete: (id: string, token: string | null) => del<void>(`cars/${id}`, token),

  getImages: async (
    carId: string,
    token: string | null,
    filters: { day?: string; month?: string; year?: string; date?: string; sortBy?: "asc" | "desc" } = {},
  ): Promise<CarImage[]> => {
    const res: CarImageListResponse = await get<CarImageListResponse>(
      `car-images/car/${carId}${buildQuery(filters as Record<string, string>)}`,
      token,
    );
    return res.data;
  },

  getArchivedImages: async (carId: string, token: string | null): Promise<CarImage[]> => {
    const res: CarImageListResponse = await get<CarImageListResponse>(`car-images/car/${carId}/archive`, token);
    return res.data;
  },

  uploadImages: async (
    carId: string,
    files: File[],
    stage: "BEFORE" | "AFTER" | "GENERAL" = "GENERAL",
    token: string | null,
    maintenanceId?: string,
  ): Promise<CarImage[]> => {
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
    const data = (await res.json()) as CarImageListResponse;
    return data.data;
  },

  deleteImage: (imageId: string, token: string | null) => del<void>(`car-images/${imageId}`, token),

  /** Dropdown helper — replaces raw get<T>() calls in TripFormModal / CarFormModal. */
  getActiveOptions: async (token: string | null): Promise<CarOption[]> => {
    const res = await get<{ data: { data: CarOption[] } }>("cars?limit=100&currentStatus=Active", token);
    return res.data.data;
  },
};