"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "../lib/auth";
import { driverService } from "../services/driver.service";
import type { Driver } from "../types/driver";

// ── Notification type ──────────────────────────────────────────────────────
export interface DriverNotification {
  type: "success" | "error";
  message: string;
}

// ── Table state / reducer ──────────────────────────────────────────────────
interface TableState {
  drivers: Driver[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
}

type TableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; drivers: Driver[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };

function reducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return {
        ...s,
        loading: false,
        drivers: a.drivers,
        total: a.total,
        pages: a.pages,
      };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "DELETE":
      return { ...s, drivers: s.drivers.filter((d) => d.id !== a.id) };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

const initialState: TableState = {
  drivers: [],
  loading: true,
  total: 0,
  pages: 1,
  error: null,
};

// ── Main hook ──────────────────────────────────────────────────────────────
export function useDrivers() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notification, setNotification] =
    useState<DriverNotification | null>(null);

  /** Show a toast for 4 seconds then auto-dismiss. */
  const notify = useCallback((n: DriverNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch drivers ─────────────────────────────────────────────────────────
  const loadDrivers = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const res = await driverService.getAll(p, q, token);
      // The response shape from the backend:
      // { data: { data: Driver[], pagination: { total, page, pages }, meta?: ... } }
      const payload = (
        res as unknown as {
          data: {
            data: Driver[];
            pagination?: { total: number; pages: number };
            meta?: { total: number; pages: number };
          };
        }
      ).data ?? res;

      dispatch({
        type: "LOAD_OK",
        drivers: payload.data ?? [],
        total:
          payload.meta?.total ?? payload.pagination?.total ?? 0,
        pages:
          payload.meta?.pages ?? payload.pagination?.pages ?? 1,
      });
    } catch {
      dispatch({
        type: "LOAD_ERR",
        error: "تعذّر تحميل بيانات السائقين. يرجى المحاولة مجدداً.",
      });
    }
  }, []);

  // Reload whenever page or search changes.
  useEffect(() => {
    loadDrivers(page, search);
  }, [page, search, loadDrivers]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteDriver = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const token = getStoredToken();
        await driverService.delete(id, token);
        dispatch({ type: "DELETE", id });
        notify({ type: "success", message: "تم حذف السائق بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message:
            err instanceof Error ? err.message : "تعذّر حذف السائق.",
        });
        return false;
      }
    },
    [notify],
  );

  // ── Search helper ─────────────────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  return {
    ...state,
    page,
    search,
    setPage,
    handleSearch,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    deleteDriver,
    notification,
    reload: () => loadDrivers(page, search),
  };
}