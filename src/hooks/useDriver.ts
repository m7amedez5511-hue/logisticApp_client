"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { driverService } from "@/src/services/driver.service";
import type { Driver, CreateDriverPayload, UpdateDriverPayload } from "@/src/types/driver";
import type { ToastNotification } from "@/src/Components/UI";

export type DriverNotification = ToastNotification;

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
  | { type: "UPDATE"; driver: Driver }
  | { type: "CLEAR_ERR" };

function reducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return { ...s, loading: false, drivers: a.drivers, total: a.total, pages: a.pages };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "DELETE":
      return { ...s, drivers: s.drivers.filter((d) => d.id !== a.id) };
    case "UPDATE":
      return { ...s, drivers: s.drivers.map((d) => (d.id === a.driver.id ? a.driver : d)) };
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

  // ── Fetch drivers ─────────────────────────────────────────────────────────
  const loadDrivers = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const { items, total, pages } = await driverService.getAll(p, q, token);
      dispatch({ type: "LOAD_OK", drivers: items, total, pages });
    } catch {
      dispatch({ type: "LOAD_ERR", error: "تعذّر تحميل بيانات السائقين. يرجى المحاولة مجدداً." });
    }
  }, []);

  useEffect(() => {
    loadDrivers(page, search);
  }, [page, search, loadDrivers]);

  // ── Create ────────────────────────────────────────────────────────────────
  const createDriver = useCallback(
    async (
      payload: CreateDriverPayload & {
        photo?: File;
        nationalPhoto?: File;
        driverCardPhoto?: File;
      },
    ): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const hasFiles = payload.photo || payload.nationalPhoto || payload.driverCardPhoto;

        if (hasFiles) {
          const created = await driverService.createWithImages(payload, token);
          if (created?.id) {
            await driverService.getById(created.id, token).catch(() => null);
          }
        } else {
          await driverService.create(payload, token);
        }

        notify({ type: "success", message: "تم إضافة السائق بنجاح." });
        await loadDrivers(page, search);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر إضافة السائق. يرجى المحاولة لاحقاً.";
        notify({ type: "error", message });
        throw err;
      }
    },
    [notify, loadDrivers, page, search],
  );

  // ── Update ────────────────────────────────────────────────────────────────
  const updateDriver = useCallback(
    async (
      id: string,
      payload: UpdateDriverPayload & {
        photo?: File;
        nationalPhoto?: File;
        driverCardPhoto?: File;
      },
    ): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const hasFiles = payload.photo || payload.nationalPhoto || payload.driverCardPhoto;

        const updatedDriver = hasFiles
          ? await driverService.updateWithImages(id, payload, token)
          : await driverService.update(id, payload, token);

        dispatch({ type: "UPDATE", driver: updatedDriver });
        notify({ type: "success", message: "تم تحديث بيانات السائق بنجاح." });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر تحديث بيانات السائق. يرجى المحاولة لاحقاً.";
        notify({ type: "error", message });
        throw err;
      }
    },
    [notify],
  );

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
        const message = err instanceof Error ? err.message : "تعذّر حذف السائق.";
        notify({ type: "error", message });
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
    createDriver,
    updateDriver,
    deleteDriver,
    notification,
    reload: () => loadDrivers(page, search),
  };
}