
// Mirrors user.service.ts exactly: token parameter, buildPayload, buildQuery.
import { get, post, put, del } from "./api";
import type { ApiResponse, ApiListResponse, Client, ClientFormData, ClientResponse } from "@/src/types/client";




/** بناء query string لجلب العملاء مع البحث والصفحات */
function buildClientsQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const clientService = {
  /** جلب قائمة العملاء مع إمكانية البحث والتصفح بين الصفحات */
  getAll: (page: number, search: string, token: string | null) =>
    get<ApiListResponse<Client>>(`client${buildClientsQuery(page, search)}`, token),

  /** جلب عميل واحد بالـ ID (مع العناوين المرفقة) */
  getById: (id: string, token: string | null) =>
    get<ApiResponse<Client>>(`client/${id}`, token),

  /** إنشاء عميل جديد */
  create: (data: ClientFormData, token: string | null) =>
    post<ClientResponse>("client", buildPayload(data), token),

  /** تعديل بيانات عميل موجود */
  update: (id: string, data: ClientFormData, token: string | null) =>
    put<ClientResponse>(`client/${id}`, buildPayload(data), token),

  /** حذف عميل */
  delete: (id: string, token: string | null) =>
    del<void>(`client/${id}`, token),
};

/** تحويل بيانات النموذج إلى payload مناسب للـ API */
function buildPayload(data: ClientFormData): Record<string, string | boolean> {
  const payload: Record<string, string | boolean> = {};

  if (data.name?.trim()) payload.name = data.name.trim();
  if (data.email?.trim()) payload.email = data.email.trim();
  if (data.phone?.trim()) payload.phone = data.phone.trim();
  if (data.taxId?.trim()) payload.taxId = data.taxId.trim();
  if (data.notes?.trim()) payload.notes = data.notes.trim();
  if (data.clientType) payload.clientType = data.clientType;
  if (typeof data.isActive === "boolean") payload.isActive = data.isActive;

  return payload;
}