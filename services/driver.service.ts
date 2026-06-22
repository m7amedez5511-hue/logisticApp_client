// services/driver.service.ts
// All API calls for the Driver module.

import { get, post, del, patch } from "./api";
import type {
  Driver,
  DriverListResponse,
  DriverDetailResponse,
  DriverReportResponse,
  CreateDriverPayload,
  UpdateDriverPayload,
} from "../types/driver";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// ── Image URL proxy ───────────────────────────────────────────────────────────
// Converts absolute Express image URLs to Next.js proxy paths to avoid CORS issues.
// Pattern matches: http(s)://any-host/uploads/driver-photos/filename.jpg
// → /api/proxy-image/driver-photos/filename.jpg

function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/uploads\/driver-photos\/(.+)$/);
  if (match) return `/api/proxy-image/driver-photos/${match[1]}`;
  return url; // return as-is if pattern doesn't match
}

function mapDriverImages<
  T extends {
    photoUrl?: string | null;
    nationalPhotoUrl?: string | null;
    driverCardPhotoUrl?: string | null;
  },
>(driver: T): T {
  return {
    ...driver,
    photoUrl:           proxyImageUrl(driver.photoUrl),
    nationalPhotoUrl:   proxyImageUrl(driver.nationalPhotoUrl),
    driverCardPhotoUrl: proxyImageUrl(driver.driverCardPhotoUrl),
  };
}

// ── Image compression ─────────────────────────────────────────────────────────
// Reduces image to max 800px and quality 0.75 before upload to avoid LIMIT_FILE_SIZE

async function compressImage(file: File, maxPx = 800, quality = 0.75): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions while preserving aspect ratio
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx);
          width  = maxPx;
        } else {
          width  = Math.round((width / height) * maxPx);
          height = maxPx;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// Compress all image fields present in the payload
async function compressPayloadImages<
  T extends { photo?: File; nationalPhoto?: File; driverCardPhoto?: File },
>(payload: T): Promise<T> {
  const result = { ...payload };
  if (result.photo)           result.photo           = await compressImage(result.photo);
  if (result.nationalPhoto)   result.nationalPhoto   = await compressImage(result.nationalPhoto);
  if (result.driverCardPhoto) result.driverCardPhoto = await compressImage(result.driverCardPhoto);
  return result;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const driverService = {
  /** GET /driver — paginated + searchable list */
  getAll: async (page = 1, search = "", token: string | null): Promise<DriverListResponse> => {
    const res = await get<DriverListResponse>(
      `driver${buildQuery({ page, limit: 12, search: search || undefined })}`,
      token,
    );
    const body = (res as unknown as { data: { data: Driver[]; pagination: unknown; meta?: unknown } }).data;
    body.data = body.data.map(mapDriverImages);
    return res;
  },

  /** GET /driver/archived */
  getArchived: async (token: string | null): Promise<DriverListResponse> => {
    const res = await get<DriverListResponse>("driver/archived", token);
    const body = (res as unknown as { data: { data: Driver[] } }).data;
    body.data = body.data.map(mapDriverImages);
    return res;
  },

  /** GET /driver/me */
  getMe: async (token: string | null): Promise<DriverDetailResponse> => {
    const res = await get<DriverDetailResponse>("driver/me", token);
    const body = res as unknown as { data: Driver };
    body.data = mapDriverImages(body.data);
    return res;
  },

  /** GET /driver/:id */
  getById: async (id: string, token: string | null): Promise<DriverDetailResponse> => {
    const res = await get<DriverDetailResponse>(`driver/${id}`, token);
    const body = res as unknown as { data: Driver };
    body.data = mapDriverImages(body.data);
    return res;
  },

  /** POST /driver  (JSON — no files) */
  create: (payload: CreateDriverPayload, token: string | null) =>
    post<{ data: Driver }>("driver", payload, token),

  /** PATCH /driver/:id  (JSON — no files) */
  update: async (id: string, payload: UpdateDriverPayload, token: string | null): Promise<{ data: Driver }> => {
    const res = await patch<{ data: Driver }>(`driver/${id}`, payload, token);
    const body = res as unknown as { data: Driver };
    body.data = mapDriverImages(body.data);
    return res;
  },

  /** DELETE /driver/:id */
  delete: (id: string, token: string | null) =>
    del<void>(`driver/${id}`, token),

  /** GET /drivers/:id/reports/daily?date=YYYY-MM-DD */
  getDailyReport: (id: string, date: string, token: string | null) =>
    get<DriverReportResponse>(
      `drivers/${id}/reports/daily?date=${encodeURIComponent(date)}`,
      token,
    ),

  // ── Multipart helpers (with auto compression) ─────────────────────────────

  /**
   * POST /driver  (multipart/form-data)
   * Compresses images before upload to stay under backend LIMIT_FILE_SIZE.
   */
  createWithImages: async (
    payload: CreateDriverPayload & {
      photo?: File;
      nationalPhoto?: File;
      driverCardPhoto?: File;
    },
    token: string | null,
  ): Promise<{ data: Driver }> => {
    // Compress before building FormData
    const compressed = await compressPayloadImages(payload);

    const form = new FormData();
    Object.entries(compressed).forEach(([key, val]) => {
      if (val !== undefined && val !== null && !(val instanceof File)) {
        form.append(key, String(val));
      }
    });
    if (compressed.photo)           form.append("photo",           compressed.photo);
    if (compressed.nationalPhoto)   form.append("nationalPhoto",   compressed.nationalPhoto);
    if (compressed.driverCardPhoto) form.append("driverCardPhoto", compressed.driverCardPhoto);

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
    const data = await res.json() as { data: Driver };
    data.data = mapDriverImages(data.data);
    return data;
  },

  /**
   * PATCH /driver/:id  (multipart/form-data)
   * Compresses images before upload to stay under backend LIMIT_FILE_SIZE.
   */
  updateWithImages: async (
    id: string,
    payload: UpdateDriverPayload & {
      photo?: File;
      nationalPhoto?: File;
      driverCardPhoto?: File;
    },
    token: string | null,
  ): Promise<{ data: Driver }> => {
    // Compress before building FormData
    const compressed = await compressPayloadImages(payload);

    const form = new FormData();
    Object.entries(compressed).forEach(([key, val]) => {
      if (val !== undefined && val !== null && !(val instanceof File)) {
        form.append(key, String(val));
      }
    });
    if (compressed.photo)           form.append("photo",           compressed.photo);
    if (compressed.nationalPhoto)   form.append("nationalPhoto",   compressed.nationalPhoto);
    if (compressed.driverCardPhoto) form.append("driverCardPhoto", compressed.driverCardPhoto);

    const res = await fetch(`/api/proxy/driver/${id}`, {
      method: "PATCH",
      // Do NOT set Content-Type — browser sets it with the correct boundary
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      cache: "no-store",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? `HTTP ${res.status}`);
    }
    const data = await res.json() as { data: Driver };
    data.data = mapDriverImages(data.data);
    return data;
  },
};