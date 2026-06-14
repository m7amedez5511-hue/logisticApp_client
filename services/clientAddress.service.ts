// خدمة عناوين العملاء — كل نداءات الـ API الخاصة بالعناوين تكون هنا فقط
// Mirrors user.service.ts pattern: explicit token param, buildPayload helper.
import { get, post, put, patch, del } from "./api";
import type {
  ApiResponse,
  ClientAddress,
  ClientAddressFormData,
} from "../types/client";

const base = (clientId: string) => `clients/${clientId}/addresses`;

export const clientAddressService = {
  /** جلب جميع عناوين عميل معين */
  getAll: (clientId: string, token: string | null) =>
    get<ApiResponse<ClientAddress[]>>(base(clientId), token),

  /** جلب عنوان واحد بالـ ID */
  getById: (clientId: string, addressId: string, token: string | null) =>
    get<ApiResponse<ClientAddress>>(`${base(clientId)}/${addressId}`, token),

  /** إضافة عنوان جديد لعميل */
  create: (clientId: string, data: ClientAddressFormData, token: string | null) =>
    post<ApiResponse<ClientAddress>>(base(clientId), buildPayload(clientId, data), token),

  /** تعديل عنوان موجود */
  update: (clientId: string, addressId: string, data: ClientAddressFormData, token: string | null) =>
    put<ApiResponse<ClientAddress>>(`${base(clientId)}/${addressId}`, buildPayload(clientId, data), token),

  /** حذف عنوان */
  delete: (clientId: string, addressId: string, token: string | null) =>
    del<void>(`${base(clientId)}/${addressId}`, token),

  /** تعيين عنوان كعنوان رئيسي — الباكند يُلغي الاختيار عن الباقين */
  setPrimary: (clientId: string, addressId: string, token: string | null) =>
    patch<ApiResponse<ClientAddress>>(`${base(clientId)}/${addressId}/primary`, {}, token),
};

/** تحويل بيانات النموذج إلى payload */
function buildPayload(clientId: string, data: ClientAddressFormData): Record<string, unknown> {
  return {
    clientId,
    label:      data.label.trim(),
    street:     data.street.trim(),
    city:       data.city.trim(),
    state:      data.state.trim(),
    postalCode: data.postalCode.trim(),
    country:    data.country.trim(),
    isPrimary:  data.isPrimary,
  };
}