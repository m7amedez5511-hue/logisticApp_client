import { get, post, put, del } from "./api";
import type {
  ApiListResponse, User, UserFormData, UserResponse, UserMe, UserListResult, UserDetail,
} from "@/src/types/user";
import type { Role } from "@/src/types/role";
import type { Branch } from "@/src/types/branch";

export interface MeApiResponse {
  success: boolean;
  message: string;
  responseAt: string;
  data: UserMe;
}

function buildUsersQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const userService = {
  getAll: async (page: number, search: string, token: string | null): Promise<UserListResult> => {
    const res: ApiListResponse<User> = await get<ApiListResponse<User>>(
      `users${buildUsersQuery(page, search)}`, token,
    );
    return {
      items: res.data.data,
      total: res.data.meta?.total ?? res.data.pagination?.total ?? 0,
      pages: res.data.meta?.pages ?? res.data.pagination?.pages ?? 1,
    };
  },

  create: async (
    data: UserFormData,
    token: string | null,
  ): Promise<User> => {
    const res: UserResponse = await post<UserResponse>("users", buildPayload(data, true), token);
    return res.data;
  },

  update: async (id: string, data: UserFormData, token: string | null): Promise<User> => {
    const res: UserResponse = await put<UserResponse>(`users/${id}`, buildPayload(data, false), token);
    return res.data;
  },

  delete: (id: string, token: string | null) => del<void>(`users/${id}`, token),

  getRoles: async (token: string | null): Promise<Role[]> => {
    const res = await get<unknown>("role?limit=100", token);
    return unwrapList<Role>(res);
  },

  getBranches: async (token: string | null): Promise<Branch[]> => {
    const res = await get<unknown>("branches?limit=100", token);
    return unwrapList<Branch>(res);
  },

  getById: async (id: string, token: string | null): Promise<UserDetail> => {
    const res = await get<unknown>(`users/${id}`, token);
    return unwrapObject<UserDetail>(res);
  },

  getMe: (token: string | null) => get<MeApiResponse>("users/me", token),
};

function unwrapList<T>(response: unknown): T[] {
  const first = response as { data?: unknown };
  const second = first.data as { data?: unknown } | undefined;
  const value = second?.data ?? first.data ?? response;
  return Array.isArray(value) ? value as T[] : [];
}

function unwrapObject<T>(response: unknown): T {
  const first = response as { data?: unknown };
  const second = first.data as { data?: unknown } | undefined;
  return (second?.data ?? first.data ?? response) as T;
}

/**
 * One-time defensive unwrap for /users/me, which has been observed to
 * return either { success, data } directly or { data: { success, data } }.
 * Documented and isolated here — nothing outside the service ever sees
 * the ambiguity.
 */
export function extractMeUser(res: MeApiResponse | { data: MeApiResponse }): UserMe | null {
  const body: MeApiResponse = (res as { data: MeApiResponse })?.data?.data
    ? (res as { data: MeApiResponse }).data
    : (res as MeApiResponse);
  const d = body?.data;
  if (!d) return null;
  if (Array.isArray(d)) return (d[0] as UserMe) ?? null;
  return d;
}

function buildPayload(data: UserFormData, isNew: boolean): Record<string, string> {
  const payload: Record<string, string> = {
    name: data.name.trim(), phone: data.phone.trim(), roleId: data.roleId, branchId: data.branchId,
  };
  if (data.email) payload.email = data.email.trim();
  if (!isNew && data.password) payload.password = data.password;
  return payload;
}