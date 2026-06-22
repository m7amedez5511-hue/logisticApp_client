// خدمة المستخدمين — كل نداءات الـ API الخاصة بالمستخدمين تكون هنا فقط
import { get, post, put, del } from "./api";
import type { ApiListResponse, User, UserFormData } from "@/src/types/user";
import type { Role } from "@/src/types/role";
import type { Branch } from "@/src/types/branch";

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
  create: (
    data: Omit<UserFormData, "password"> & { password: string },
    token: string | null,
  ) => post<UserResponse>("users", buildPayload(data, true), token),

  /** تعديل بيانات مستخدم موجود */
  update: (id: string, data: UserFormData, token: string | null) =>
    put<UserResponse>(`users/${id}`, buildPayload(data, false), token),

  /** حذف مستخدم */
  delete: (id: string, token: string | null) => del<void>(`users/${id}`, token),
  //get role
  getRoles: (token: string | null) =>
    get<{ data: { data: Role[] } }>("role?limit=100", token),
//get Branches for user form
  getBranches: (token: string | null) =>
    get<{ data: { data: Branch[] } }>("branches?limit=100", token),
  //get user by id
  getById: (id: string, token: string | null) =>
    get<{
      data: User & {
        photo: string | null;
        refreshToken: string | null;
        isDeleted: boolean;
        deletedAt: string | null;
        updatedAt: string;
        passwordChangedAt: string | null;
        role: { name: string; description: string };
        branch: { name: string };
      };
    }>(`users/${id}`, token),
};

/** تحويل بيانات النموذج إلى payload مناسب للـ API */
function buildPayload(
  data: UserFormData,
  isNew: boolean,
): Record<string, string> {
  const payload: Record<string, string> = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    roleId: data.roleId,
    branchId: data.branchId,
  };
  if (data.email) payload.email = data.email.trim();
  if (isNew && data.password) payload.password = data.password;
  else if (!isNew && data.password) payload.password = data.password;
  return payload;
}
