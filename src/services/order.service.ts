// services/order.service.ts
import { get, post, put, del } from "./api";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  UpdateOrderStatusPayload,
  TransferOrderPayload,
  OrdersResponse,
} from "@/src/types/order";

export const orderService = {
  /** Get all orders (paginated) */
  getAll: (params?: Record<string, string | number>) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return get<OrdersResponse>(`orders${qs}`);
  },

  /** Get order by ID */
  getById: (id: string) => get<Order>(`orders/${id}`),

  /** Create new order */
  create: (payload: CreateOrderPayload) =>
    post<Order>("orders", payload),

  /** Update order metadata */
  update: (id: string, payload: UpdateOrderPayload) =>
    put<Order>(`orders/${id}`, payload),

  /** Update order status with optional reason */
  updateStatus: (id: string, payload: UpdateOrderStatusPayload) =>
    put<Order>(`orders/${id}/status`, payload),

  /** Transfer order to a different trip */
  transfer: (id: string, payload: TransferOrderPayload) =>
    put<Order>(`orders/${id}/transfer`, payload),

  /** Soft-delete an order */
  delete: (id: string) => del<void>(`orders/${id}`),

  /** Get archived orders */
  getArchived: () => get<OrdersResponse>("orders/archived"),
};