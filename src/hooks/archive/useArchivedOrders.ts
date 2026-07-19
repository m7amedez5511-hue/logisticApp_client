"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedOrderService } from "@/src/services/archive/archivedOrder.service";
import type { ArchivedOrder } from "@/src/types/order";

const PAGE_SIZE = 10;

// ── Table state / reducer ──────────────────────────────────────────────────
// نفس شكل TableState/TableAction اللي في useOrder.ts عشان الهوكين يفضلوا متسقين
interface TableState {
  orders: ArchivedOrder[];
  loading: boolean;
  error: string | null;
}

type TableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; orders: ArchivedOrder[] }
  | { type: "LOAD_ERR"; error: string }
  | { type: "CLEAR_ERR" };

function reducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return { ...s, loading: false, orders: Array.isArray(a.orders) ? a.orders : [] };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

const initialState: TableState = {
  orders: [],
  loading: true,
  error: null,
};

// ── Main hook ──────────────────────────────────────────────────────────────
export function useArchivedOrders() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // ── Fetch archived orders ─────────────────────────────────────────────
  const load = useCallback(async () => {
  dispatch({ type: "LOAD_START" });
  try {
    const token = getStoredToken();
    const orders = await archivedOrderService.getAllUnwrapped(token);
    dispatch({ type: "LOAD_OK", orders });
  } catch {
    dispatch({ type: "LOAD_ERR", error: "تعذّر تحميل الطلبات المؤرشفة. يرجى المحاولة لاحقاً." });
  }
}, []);
  useEffect(() => {
    load();
  }, [load]);

  // ── Client-side search — الـ endpoint معندوش ?search= param ────────────
  const filtered = !search.trim()
    ? state.orders
    : state.orders.filter((o) => {
        const q = search.trim().toLowerCase();
        return (
          o.shipmentNumber.toLowerCase().includes(q) ||
          o.recipientName.toLowerCase().includes(q) ||
          o.recipientPhone.includes(q)
        );
      });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Search / page helpers ──────────────────────────────────────────────
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return {
    orders: paginated,
    total: filtered.length,
    loading: state.loading,
    pages,
    page,
    search,
    error: state.error,
    setPage,
    handleSearch,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    refresh: load,
  };
}