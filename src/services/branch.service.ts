import { get, post, patch, del } from "./api";
import type {
  ApiListResponse, Branch, BranchDetail, BranchFormData, BranchResponse,
  BranchListResult, BranchOption,
} from "@/src/types/branch";

function buildBranchesQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const branchService = {
  getAll: async (page: number, search: string, token: string | null): Promise<BranchListResult> => {
    const res: ApiListResponse<Branch> = await get<ApiListResponse<Branch>>(
      `branches${buildBranchesQuery(page, search)}`,
      token,
    );
    return {
      items: res.data.data,
      total: res.data.meta?.total ?? res.data.pagination?.total ?? 0,
      pages: res.data.meta?.pages ?? res.data.pagination?.pages ?? 1,
    };
  },

  create: async (data: BranchFormData, token: string | null): Promise<Branch> => {
    const res: BranchResponse = await post<BranchResponse>("branches", buildPayload(data), token);
    return res.data;
  },

  update: async (id: string, data: Partial<BranchFormData>, token: string | null): Promise<Branch> => {
    const res: BranchResponse = await patch<BranchResponse>(`branches/${id}`, buildPayload(data), token);
    return res.data;
  },

  delete: (id: string, token: string | null) => del<void>(`branches/${id}`, token),

  getById: async (id: string, token: string | null): Promise<BranchDetail> => {
    const res = await get<{ data: BranchDetail }>(`branches/${id}`, token);
    return res.data;
  },

  /** Dropdown helper — replaces raw `get<{data:{data:Branch[]}}>("branches?limit=100")` in form modals. */
  getOptions: async (token: string | null): Promise<BranchOption[]> => {
    const res = await get<{ data: { data: BranchOption[] } }>("branches?limit=100", token);
    return res.data.data;
  },
};

function buildPayload(data: Partial<BranchFormData>): Record<string, string | number> {
  const payload: Record<string, string | number> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.email) payload.email = data.email.trim();
  if (data.phone) payload.phone = data.phone.trim();
  if (data.country) payload.country = data.country.trim();
  if (data.city !== undefined) payload.city = data.city.trim();
  if (data.state) payload.state = data.state.trim();
  if (data.district) payload.district = data.district.trim();
  if (data.street !== undefined) payload.street = data.street.trim();
  if (data.buildingNo) payload.buildingNo = data.buildingNo.trim();
  if (data.unitNo) payload.unitNo = data.unitNo.trim();
  if (data.zipCode) payload.zipCode = data.zipCode.trim();
  if (data.latitude && !isNaN(Number(data.latitude))) payload.latitude = Number(data.latitude);
  if (data.longitude && !isNaN(Number(data.longitude))) payload.longitude = Number(data.longitude);
  return payload;
}