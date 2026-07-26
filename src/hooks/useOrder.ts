"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
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

  // Ref so the dismiss timer can be cleared if a new notification arrives
  // before the previous one expires — prevents stale-closure memory leaks
  // and premature/duplicate toast dismissal on rapid successive calls.
  // Pattern copied from useTrip.ts for consistency across list hooks.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((n: ToastNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(n);
    timerRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  // Clear pending timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── Fetch orders ───────────────────────────────────────────────────────
  const loadOrders = useCallback(async (p: number, q: string, status: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const { items, total, pages } = await orderService.getAll({
        page: p,
        limit: 12,
        ...(q ? { search: q } : {}),
        ...(status ? { currentStatus: status } : {}),
      });

      dispatch({ type: "LOAD_OK", orders: items, total, pages });
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
        const message = err instanceof Error ? err.message : "تعذّر إنشاء الطلب. يرجى المحاولة لاحقاً.";
        notify({ type: "error", message });
        throw err;
      }
    },
    [notify, loadOrders, page, search, statusFilter],
  );

  // ── Update ──────────────────────────────────────────────────────────────
  const updateOrder = useCallback(
    async (id: string, payload: UpdateOrderPayload): Promise<boolean> => {
      try {
        const updated = await orderService.update(id, payload);
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
        const updated = await orderService.updateStatus(id, payload);
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