import { get, post, put, del } from "./api";
import type { ApiListResponse, User, UserFormData, UserResponse, UserMe } from "@/src/types/user";
import type { Role } from "@/src/types/role";
import type { Branch } from "@/src/types/branch";

// الشكل الحقيقي لاستجابة /users/me:
// { success, message, responseAt, data: <UserMe> }
// أي "data" هنا هي بيانات اليوزر مباشرة، مفيش data.data متداخلة.
export interface MeApiResponse {
  success: boolean;
  message: string;
  responseAt: string;
  data: UserMe;
}


/**Building a query string to fetch users with search and pagination*/
function buildUsersQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const userService = {
  /** Fetching the user list with the ability to search and browse through pages*/
  getAll: (page: number, search: string, token: string | null) =>
    get<ApiListResponse<User>>(`users${buildUsersQuery(page, search)}`, token),

  /** create new account*/
  create: (
    data: Omit<UserFormData, "password"> & { password: string },
    token: string | null,
  ) => post<UserResponse>("users", buildPayload(data, true), token),

  /**Edit existing user info*/
  update: (id: string, data: UserFormData, token: string | null) =>
    put<UserResponse>(`users/${id}`, buildPayload(data, false), token),

  /** delete user*/
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
    getMe: (token: string | null) =>
    get<MeApiResponse>("users/me", token),
};

/**
 * بتفكك استجابة /users/me لأي شكل ييجي بيه من السيرفر:
 * - سواء الـ get() بيرجع الـ body مباشرة: { success, data: <user> }
 * - أو بيرجع wrapper شكله axios-like: { data: { success, data: <user> } }
 * فبناخد أول data موجودة (لو فيها success/message نبقى في المكان الصح)،
 * وبعدين ناخد الـ data اللي جواها (بيانات اليوزر الفعلية).
 * ملحوظة: مفيش تفكيك مزدوج بره الدالة دي، وأي حد بينادي عليها
 * لازم يبعتلها الـ response زي ما هو من غير ما يعمل res.data قبلها.
 */
export function extractMeUser(res: MeApiResponse | { data: MeApiResponse }): UserMe | null {
  const body: MeApiResponse = (res as { data: MeApiResponse })?.data?.data
    ? (res as { data: MeApiResponse }).data
    : (res as MeApiResponse);

  const d = body?.data;
  if (!d) return null;
  if (Array.isArray(d)) return (d[0] as UserMe) ?? null;
  return d as UserMe;
}

/** Converting the form data into a payload suitable for the API */
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