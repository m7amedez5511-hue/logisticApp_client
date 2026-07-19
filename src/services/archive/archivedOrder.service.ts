import { get } from "../api";
import type { ArchivedOrder, ArchivedOrderListResponse } from "@/src/types/order";

export const archivedOrderService = {
  getAll: (token: string | null) => get<ArchivedOrderListResponse>("orders/archived", token),
  getAllUnwrapped: async (token: string | null): Promise<ArchivedOrder[]> => {
    const res = await archivedOrderService.getAll(token);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
};