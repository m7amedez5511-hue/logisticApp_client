import { get } from "./api";
import type { AuditLog } from "@/src/types/audit";

// Step 1: New service, following the exact same shape/pattern as the other
// list services in this file's siblings (userService.getAll, branchService.
// getAll, roleService.getAll) — GET with page/limit, unwrap { data: { data,
// meta|pagination } } into a clean { items, total } result. No audit service
// previously existed even though src/types/audit.ts and AuditTable already
// consume AuditLog, so this fills that gap using the established contract.
export interface AuditListResponse {
  success: boolean;
  message: string;
  responseAt: string;
  data: {
    data: AuditLog[];
    meta?: { total: number; page: number; limit: number; totalPages: number };
    pagination?: { total: number; page: number; pages: number };
  };
}

function buildAuditQuery(page: number, limit: number): string {
  return `?page=${page}&limit=${limit}`;
}

export const auditService = {
  // The real backend endpoint is /api/v1/audit and it responds with
  // { data: { data: [...], meta: { total, page, limit, totalPages } } }.
  getAll: async (page = 1, limit = 1): Promise<{ items: AuditLog[]; total: number }> => {
    const res = await get<AuditListResponse>(`audit${buildAuditQuery(page, limit)}`);
    return {
      items: res.data?.data ?? [],
      total: res.data?.meta?.total ?? res.data?.pagination?.total ?? 0,
    };
  },
};