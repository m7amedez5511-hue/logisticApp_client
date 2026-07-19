// services/order.service.ts
import { get, post, put, del, patch } from "./api";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  UpdateOrderStatusPayload,
  TransferOrderPayload,
  OrderListResult,
} from "@/src/types/order";

/**
 * One-time defensive unwrap for order endpoints. Documented here because
 * the backend for this resource isn't 100% consistent about wrapping
 * responses in `{ data }` — some handlers return the entity directly.
 */
function unwrapOrder(res: Order | { data: Order }): Order {
  const maybeWrapped = res as { data?: Order };
  return maybeWrapped?.data ? maybeWrapped.data : (res as Order);
}

interface OrdersListEnvelope {
  data: {
    data: Order[];
    meta?: { total: number; page: number; limit: number; totalPages: number };
  };
}

export const orderService = {
  /** Get all orders (paginated) — returns a clean, unwrapped result. */
  getAll: async (params?: Record<string, string | number>): Promise<OrderListResult> => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    const res = await get<OrdersListEnvelope>(`orders${qs}`);
    const payload = res.data;
    return {
      items: payload.data ?? [],
      total: payload.meta?.total ?? 0,
      pages: payload.meta?.totalPages ?? 1,
    };
  },

  /** Get order by ID */
  getById: async (id: string): Promise<Order> =>
    unwrapOrder(await get<Order | { data: Order }>(`orders/${id}`)),

  /** Create new order */
  create: async (payload: CreateOrderPayload): Promise<Order> =>
    unwrapOrder(await post<Order | { data: Order }>("orders", payload)),

  /** Update order metadata */
  update: async (id: string, payload: UpdateOrderPayload): Promise<Order> =>
    unwrapOrder(await patch<Order | { data: Order }>(`orders/${id}`, payload)),

  /** Update order status with optional reason */
  updateStatus: async (id: string, payload: UpdateOrderStatusPayload): Promise<Order> =>
    unwrapOrder(await patch<Order | { data: Order }>(`orders/${id}/status`, payload)),

  /** Transfer order to a different trip */
  transfer: (id: string, payload: TransferOrderPayload) =>
    put<Order>(`orders/${id}/transfer`, payload),

  /** Soft-delete an order */
  delete: (id: string) => del<void>(`orders/${id}`),

  /** Get archived orders */
  getArchived: async (): Promise<Order[]> => {
    const res = await get<{ data: { data: Order[] } }>("orders/archived");
    return res.data.data ?? [];
  },
};