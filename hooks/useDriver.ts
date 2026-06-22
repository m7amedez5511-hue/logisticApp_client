"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "../lib/auth";
import { driverService } from "../services/driver.service";
import type { Driver, CreateDriverPayload, UpdateDriverPayload } from "../types/driver";

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
  const [notification, setNotification] = useState<DriverNotification | null>(null);

  // Show a toast for 4 seconds then auto-dismiss
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
          // The multipart create response isn't guaranteed to carry the same
          // photoUrl/nationalPhotoUrl/driverCardPhotoUrl shape as GET /driver/:id
          // (signed URL, CDN path, etc.), so re-fetch by id before the list reload
          // picks it up — cheap insurance against a half-loaded card.
          if (created?.id) {
            await driverService.getById(created.id, token).catch(() => null);
          }
        } else {
          await driverService.create(payload, token);
        }

        notify({ type: "success", message: "تم إضافة السائق بنجاح." });
        // Reload list to include the new driver
        await loadDrivers(page, search);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر إضافة السائق.";
        notify({ type: "error", message });
        return false;
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
          // Route to multipart when files are present — avoids File→{} serialization bug
          await driverService.updateWithImages(id, payload, token);
          // Image URLs returned by the multipart endpoint aren't guaranteed to match
          // the shape from GET /driver/:id (signed URL, CDN path, etc.), so re-fetch
          // the canonical record instead of trusting the mutation response.
          const fresh = await driverService.getById(id, token);
          updatedDriver = (fresh as unknown as { data: Driver }).data;
        } else {
          const res = await driverService.update(id, payload, token);
          updatedDriver = (res as unknown as { data: Driver }).data;
        }

        // Instantly update the row in the list without a full reload
        dispatch({ type: "UPDATE", driver: updatedDriver });
        notify({ type: "success", message: "تم تحديث بيانات السائق بنجاح." });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر تحديث بيانات السائق.";
        notify({ type: "error", message });
        return false;
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