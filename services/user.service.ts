// خدمة المستخدمين — كل نداءات الـ API الخاصة بالمستخدمين تكون هنا فقط
import { get, post, put, del } from "./api";
import type { ApiListResponse, User, UserFormData } from "../types/user";
import type { Role } from "../types/role";
import type { Branch } from "../types/branch";

/** نوع الاستجابة لعملية واحدة على مستخدم */
export interface UserResponse {
  data: User;
}

/** بناء query string لجلب المستخدمين مع البحث والصفحات */
function buildUsersQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const userService = {
  /** جلب قائمة المستخدمين مع إمكانية البحث والتصفح بين الصفحات */
  getAll: (page: number, search: string, token: string | null) =>
    get<ApiListResponse<User>>(`users${buildUsersQuery(page, search)}`, token),

  /** إنشاء مستخدم جديد */
  create: (data: Omit<UserFormData, "password"> & { password: string }, token: string | null) =>
    post<UserResponse>("users", buildPayload(data, true), token),

  /** تعديل بيانات مستخدم موجود */
  update: (id: string, data: UserFormData, token: string | null) =>
    put<UserResponse>(`users/${id}`, buildPayload(data, false), token),

  /** حذف مستخدم */
  delete: (id: string, token: string | null) =>
    del<void>(`users/${id}`, token),

  /** جلب قائمة الأدوار لاستخدامها في نموذج المستخدم */
  getRoles: (token: string | null) =>
    get<{ data: { data: Role[] } }>("role?limit=100", token),

  /** جلب قائمة الفروع لاستخدامها في نموذج المستخدم */
  getBranches: (token: string | null) =>
    get<{ data: { data: Branch[] } }>("branches?limit=100", token),
};

/** تحويل بيانات النموذج إلى payload مناسب للـ API */
function buildPayload(data: UserFormData, isNew: boolean): Record<string, string> {
  const payload: Record<string, string> = {
    name:     data.name.trim(),
    phone:    data.phone.trim(),
    roleId:   data.roleId,
    branchId: data.branchId,
  };
  if (data.email)                    payload.email    = data.email.trim();
  if (isNew && data.password)        payload.password = data.password;
  else if (!isNew && data.password)  payload.password = data.password;
  return payload;
}