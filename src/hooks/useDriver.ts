"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
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
    // Instantly reflect updated driver in the list without a full reload
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

  // Show a toast for 4 seconds then auto-dismiss
  const notify = useCallback((n: ToastNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch drivers ─────────────────────────────────────────────────────────
  const loadDrivers = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const res = await driverService.getAll(p, q, token);
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
        total: payload.meta?.total ?? payload.pagination?.total ?? 0,
        pages: payload.meta?.pages ?? payload.pagination?.pages ?? 1,
      });
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
          const res = await driverService.createWithImages(payload, token);
          const created = (res as unknown as { data: Driver }).data;
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
        // ✅ بنعرض رسالة الخطأ كـ toast برضو، مش بس نرميها لفوق
        const message = err instanceof Error ? err.message : "تعذّر إضافة السائق. يرجى المحاولة لاحقاً.";
        notify({ type: "error", message });
        throw err; // يفضل يترمي عشان DriverFormModal يعرضه جوه المودال كمان لو محتاج
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

        let updatedDriver: Driver;

        if (hasFiles) {
          await driverService.updateWithImages(id, payload, token);
          const fresh = await driverService.getById(id, token);
          updatedDriver = (fresh as unknown as { data: Driver }).data;
        } else {
          const res = await driverService.update(id, payload, token);
          updatedDriver = (res as unknown as { data: Driver }).data;
        }

        dispatch({ type: "UPDATE", driver: updatedDriver });
        notify({ type: "success", message: "تم تحديث بيانات السائق بنجاح." });
        return true;
      } catch (err) {
        // ✅ نفس الفكرة هنا — أي فشل في التحديث يبان كـ toast أحمر
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