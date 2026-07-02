import { get } from "../api";
import type { ArchivedOrderListResponse } from "@/src/types/order";

export const archivedOrderService = {
  /** Fetching the full archived order list (endpoint returns no pagination meta) */
  getAll: (token: string | null) =>
    get<ArchivedOrderListResponse>("orders/archived", token),
};