import { get, post, del, patch } from "./api";
import type {
  Driver,
  DriverListResponse,
  DriverDetailResponse,
  DriverReportResponse,
  DriverListResult,
  DriverReportResult,
  DriverOption,
  CreateDriverPayload,
  UpdateDriverPayload,
} from "@/src/types/driver";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// ── Image URL normaliser ──────────────────────────────────────────────────────
function normaliseImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url;
}

function mapDriverImages<
  T extends {
    photoUrl?: string | null;
    nationalPhotoUrl?: string | null;
    driverCardPhotoUrl?: string | null;
  }
>(driver: T): T {
  return {
    ...driver,
    photoUrl:           normaliseImageUrl(driver.photoUrl),
    nationalPhotoUrl:   normaliseImageUrl(driver.nationalPhotoUrl),
    driverCardPhotoUrl: normaliseImageUrl(driver.driverCardPhotoUrl),
  };
}

// ── Image compression ─────────────────────────────────────────────────────────
async function compressImage(file: File, maxPx = 1024, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width <= maxPx && height <= maxPx) {
        resolve(file);
        return;
      }

      if (width >= height) {
        height = Math.round((height / width) * maxPx);
        width  = maxPx;
      } else {
        width  = Math.round((width / height) * maxPx);
        height = maxPx;
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      const mimeType = file.type || "image/jpeg";
      if (mimeType !== "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const isLossy = mimeType === "image/jpeg" || mimeType === "image/webp";

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size < 100) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: mimeType, lastModified: Date.now() }));
        },
        mimeType,
        isLossy ? quality : undefined,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

async function compressPayloadImages<
  T extends { photo?: File; nationalPhoto?: File; driverCardPhoto?: File }
>(payload: T): Promise<T> {
  const result = { ...payload };
  if (result.photo)           result.photo           = await compressImage(result.photo);
  if (result.nationalPhoto)   result.nationalPhoto   = await compressImage(result.nationalPhoto);
  if (result.driverCardPhoto) result.driverCardPhoto = await compressImage(result.driverCardPhoto);
  return result;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const driverService = {
  /** GET /driver — returns a clean, unwrapped, fully-typed result. */
  getAll: async (page = 1, search = "", token: string | null): Promise<DriverListResult> => {
    const res: DriverListResponse = await get<DriverListResponse>(
      `driver${buildQuery({ page, limit: 12, search: search || undefined })}`,
      token,
    );
    const body = res.data;
    return {
      items: body.data.map(mapDriverImages),
      total: body.meta?.total ?? body.pagination?.total ?? 0,
      pages: body.meta?.pages ?? body.pagination?.pages ?? 1,
    };
  },

  /** GET /driver/archived */
  getArchived: async (token: string | null): Promise<Driver[]> => {
    const res: DriverListResponse = await get<DriverListResponse>("driver/archived", token);
    return res.data.data.map(mapDriverImages);
  },

  /** GET /driver/me */
  getMe: async (token: string | null): Promise<Driver> => {
    const res: DriverDetailResponse = await get<DriverDetailResponse>("driver/me", token);
    return mapDriverImages(res.data);
  },

  /** GET /driver/:id */
  getById: async (id: string, token: string | null): Promise<Driver> => {
    const res: DriverDetailResponse = await get<DriverDetailResponse>(`driver/${id}`, token);
    return mapDriverImages(res.data);
  },

  /** POST /driver  (JSON — no files) */
  create: async (payload: CreateDriverPayload, token: string | null): Promise<Driver> => {
    const res = await post<{ data: Driver }>("driver", payload, token);
    return res.data;
  },

  /** PATCH /driver/:id  (JSON — no files) */
  update: async (id: string, payload: UpdateDriverPayload, token: string | null): Promise<Driver> => {
    const res = await patch<{ data: Driver }>(`driver/${id}`, payload, token);
    return mapDriverImages(res.data);
  },

  /** DELETE /driver/:id */
  delete: (id: string, token: string | null) =>
    del<void>(`driver/${id}`, token),

  /** GET /drivers/:id/reports/daily?date=YYYY-MM-DD */
  getDailyReport: async (id: string, date: string, token: string | null): Promise<DriverReportResult> => {
    const res: DriverReportResponse = await get<DriverReportResponse>(
      `drivers/${id}/reports/daily?date=${encodeURIComponent(date)}`,
      token,
    );
    return res.data;
  },

  // ── Multipart helpers (with auto compression) ─────────────────────────────

  createWithImages: async (
    payload: CreateDriverPayload & {
      photo?: File;
      nationalPhoto?: File;
      driverCardPhoto?: File;
    },
    token: string | null,
  ): Promise<Driver> => {
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
    return mapDriverImages(data.data);
  },

  updateWithImages: async (
    id: string,
    payload: UpdateDriverPayload & {
      photo?: File;
      nationalPhoto?: File;
      driverCardPhoto?: File;
    },
    token: string | null,
  ): Promise<Driver> => {
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
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      cache: "no-store",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message ?? `HTTP ${res.status}`);
    }
    const data = await res.json() as { data: Driver };
    return mapDriverImages(data.data);
  },

  /** Dropdown helper — replaces raw get<T>() calls in TripFormModal. */
  getActiveOptions: async (token: string | null): Promise<DriverOption[]> => {
    const res = await get<{ data: { data: DriverOption[] } }>(
      "driver?limit=100&status=Active",
      token,
    );
    return res.data.data;
  },
};