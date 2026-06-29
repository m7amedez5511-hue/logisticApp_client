
import { get, post, patch, del } from "./api";
import type { ApiListResponse, Branch, BranchDetail, BranchFormData } from "@/src/types/branch";

/** The type of response for a single operation on a branch*/
export interface BranchResponse {
  data: Branch;
}

/** Building a query string to fetch branches with search and pagination*/
function buildBranchesQuery(page: number, search: string): string {
  return `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export const branchService = {
  /** Bring up the list of branches with the ability to search and browse between pages*/
  getAll: (page: number, search: string, token: string | null) =>
    get<ApiListResponse<Branch>>(`branches${buildBranchesQuery(page, search)}`, token),

  /** create new branch*/
  create: (data: BranchFormData, token: string | null) =>
    post<BranchResponse>("branches", buildPayload(data), token),

  /** update branch*/
  update: (id: string, data: Partial<BranchFormData>, token: string | null) =>
    patch<BranchResponse>(`branches/${id}`, buildPayload(data), token),

  /**delete branch*/
  delete: (id: string, token: string | null) => del<void>(`branches/${id}`, token),

  /** get branch by id*/
  getById: (id: string, token: string | null) =>
    get<{ data: BranchDetail }>(`branches/${id}`, token),
};

/** Converting the form data into a payload suitable for the API*/
function buildPayload(
  data: Partial<BranchFormData>,
): Record<string, string | number> {
  const payload: Record<string, string | number> = {};

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.email)              payload.email = data.email.trim();
  if (data.phone)              payload.phone = data.phone.trim();
  if (data.country)            payload.country = data.country.trim();
  if (data.city !== undefined) payload.city = data.city.trim();
  if (data.state)              payload.state = data.state.trim();
  if (data.district)           payload.district = data.district.trim();
  if (data.street !== undefined) payload.street = data.street.trim();
  if (data.buildingNo)         payload.buildingNo = data.buildingNo.trim();
  if (data.unitNo)             payload.unitNo = data.unitNo.trim();
  if (data.zipCode)            payload.zipCode = data.zipCode.trim();

  if (data.latitude  && !isNaN(Number(data.latitude)))  payload.latitude  = Number(data.latitude);
  if (data.longitude && !isNaN(Number(data.longitude))) payload.longitude = Number(data.longitude);

  return payload;
}