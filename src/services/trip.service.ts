import { get, post, patch, del } from "./api";
import type {
  Trip, TripListResponse, TripDetailResponse, TripReportResponse,
  TripListResult, TripReportResult,
  CreateTripPayload, UpdateTripPayload, TripListParams,
  ArchivedTripListResponse, ArchivedTripResponse,
} from "@/src/types/trip";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const tripService = {
  getAll: async (params: TripListParams = {}, token: string | null): Promise<TripListResult> => {
    const res: TripListResponse = await get<TripListResponse>(`trip${buildQuery({ ...params })}`, token);
    return {
      items: res.data.data,
      total: res.data.pagination?.total ?? 0,
      pages: res.data.pagination?.totalPages ?? 1,
    };
  },

  getArchived: async (params: TripListParams = {}, token: string | null): Promise<TripListResult> => {
    const res: ArchivedTripListResponse = await get<ArchivedTripListResponse>(
      `trip/archived${buildQuery({ ...params })}`,
      token,
    );
    return {
      items: res.data.data,
      total: res.data.meta.total,
      pages: res.data.meta.totalPages,
    };
  },

  getArchivedById: async (id: string, token: string | null): Promise<Trip> => {
    const res: ArchivedTripResponse = await get<ArchivedTripResponse>(`trip/archived/${id}`, token);
    return res.data;
  },

  getById: async (id: string, token: string | null): Promise<Trip> => {
    const res: TripDetailResponse = await get<TripDetailResponse>(`trip/${id}`, token);
    return res.data;
  },

  create: async (payload: CreateTripPayload, token: string | null): Promise<Trip> => {
    const res = await post<{ data: Trip }>("trip", payload, token);
    return res.data;
  },

  update: async (id: string, payload: UpdateTripPayload, token: string | null): Promise<Trip> => {
    const res = await patch<{ data: Trip }>(`trip/${id}`, payload, token);
    return res.data;
  },

  delete: (id: string, token: string | null) => del<void>(`trip/${id}`, token),

  getReport: async (id: string, token: string | null): Promise<TripReportResult> => {
    const res: TripReportResponse = await get<TripReportResponse>(`trip/${id}/reports`, token);
    return res.data;
  },

  getClientReport: async (id: string, clientId: string, token: string | null): Promise<TripReportResult> => {
    const res: TripReportResponse = await get<TripReportResponse>(`trip/${id}/reports/client/${clientId}`, token);
    return res.data;
  },
};