"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { orderService } from "@/src/services/order.service";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  UpdateOrderStatusPayload,
} from "@/src/types/order";
import type { ToastNotification } from "@/src/Components/UI";

export type OrderNotification = ToastNotification;

// ── Table state / reducer ──────────────────────────────────────────────────
// Mirrors useDriver.ts's TableState/TableAction shape so the two resource
// hooks stay readable side by side.
interface TableState {
  orders: Order[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
}

type TableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; orders: Order[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE"; order: Order }
  | { type: "CLEAR_ERR" };

function reducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return { ...s, loading: false, orders: a.orders, total: a.total, pages: a.pages };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "DELETE":
      return { ...s, orders: s.orders.filter((o) => o.id !== a.id) };
    // Instantly reflect the updated order in the list without a full reload
    case "UPDATE":
      return { ...s, orders: s.orders.map((o) => (o.id === a.order.id ? a.order : o)) };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

const initialState: TableState = {
  orders: [],
  loading: true,
  total: 0,
  pages: 1,
  error: null,
};

// ── Main hook ──────────────────────────────────────────────────────────────
export function useOrders() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [notification, setNotification] = useState<ToastNotification | null>(null);

  // Show a toast for 4 seconds then auto-dismiss — same timing as useDriver.ts
  const notify = useCallback((n: ToastNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch orders ───────────────────────────────────────────────────────
  const loadOrders = useCallback(async (p: number, q: string, status: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const res = await orderService.getAll({
        page: p,
        limit: 12,
        ...(q ? { search: q } : {}),
        ...(status ? { currentStatus: status } : {}),
      });
      const payload = (res as unknown as { data: { data: Order[]; meta: { total: number; totalPages: number } } }).data ?? res;

      dispatch({
        type: "LOAD_OK",
        orders: payload.data ?? [],
        total: payload.meta?.total ?? 0,
        pages: payload.meta?.totalPages ?? 1,
      });
    } catch {
      dispatch({ type: "LOAD_ERR", error: "تعذّر تحميل بيانات الطلبات. يرجى المحاولة مجدداً." });
    }
  }, []);

  useEffect(() => {
    loadOrders(page, search, statusFilter);
  }, [page, search, statusFilter, loadOrders]);

  // ── Create ──────────────────────────────────────────────────────────────
  const createOrder = useCallback(
    async (payload: CreateOrderPayload): Promise<boolean> => {
      try {
        await orderService.create(payload);
        notify({ type: "success", message: "تم إنشاء الطلب بنجاح." });
        await loadOrders(page, search, statusFilter);
        return true;
      } catch (err) {
        // نعرض رسالة الخطأ كـ toast برضو، مش بس نرميها لفوق
        const message = err instanceof Error ? err.message : "تعذّر إنشاء الطلب. يرجى المحاولة لاحقاً.";
        notify({ type: "error", message });
        throw err; // يفضل يترمي عشان OrderFormModal يعرضه جوه المودال كمان لو محتاج
      }
    },
    [notify, loadOrders, page, search, statusFilter],
  );

  // ── Update ──────────────────────────────────────────────────────────────
  const updateOrder = useCallback(
    async (id: string, payload: UpdateOrderPayload): Promise<boolean> => {
      try {
        const res = await orderService.update(id, payload);
        const updated = (res as unknown as { data: Order }).data ?? (res as unknown as Order);
        dispatch({ type: "UPDATE", order: updated });
        notify({ type: "success", message: "تم تحديث الطلب بنجاح." });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر تحديث الطلب. يرجى المحاولة لاحقاً.";
        notify({ type: "error", message });
        throw err;
      }
    },
    [notify],
  );

  // ── Update status (separate endpoint — orders/:id/status) ─────────────
  const updateStatus = useCallback(
    async (id: string, payload: UpdateOrderStatusPayload): Promise<boolean> => {
      try {
        const res = await orderService.updateStatus(id, payload);
        const updated = (res as unknown as { data: Order }).data ?? (res as unknown as Order);
        dispatch({ type: "UPDATE", order: updated });
        notify({ type: "success", message: "تم تحديث حالة الطلب بنجاح." });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر تحديث حالة الطلب.";
        notify({ type: "error", message });
        throw err;
      }
    },
    [notify],
  );

  // ── Delete ──────────────────────────────────────────────────────────────
  const deleteOrder = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await orderService.delete(id);
        dispatch({ type: "DELETE", id });
        notify({ type: "success", message: "تم حذف الطلب بنجاح." });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر حذف الطلب.";
        notify({ type: "error", message });
        return false;
      }
    },
    [notify],
  );

  // ── Search / filter helpers ────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  return {
    ...state,
    page,
    search,
    statusFilter,
    setPage,
    handleSearch,
    handleStatusFilter,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    createOrder,
    updateOrder,
    updateStatus,
    deleteOrder,
    notification,
    reload: () => loadOrders(page, search, statusFilter),
  };
}