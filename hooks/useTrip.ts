"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "../lib/auth";
import { tripService } from "../services/trip.service";
import type { Trip, TripStatus, CreateTripPayload, UpdateTripPayload } from "../types/trip";

// ── Notification type ──────────────────────────────────────────────────────
export interface TripNotification {
  type: "success" | "error";
  message: string;
}

// ── Table state / reducer ──────────────────────────────────────────────────
interface TableState {
  trips: Trip[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
}

type TableAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; trips: Trip[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "ADD";    trip: Trip }
  | { type: "UPDATE"; trip: Trip }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_ERR" };

function reducer(s: TableState, a: TableAction): TableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return { ...s, loading: false, trips: a.trips, total: a.total, pages: a.pages };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "ADD":
      return { ...s, trips: [a.trip, ...s.trips], total: s.total + 1 };
    case "UPDATE":
      return { ...s, trips: s.trips.map(t => (t.id === a.trip.id ? a.trip : t)) };
    case "DELETE":
      return { ...s, trips: s.trips.filter(t => t.id !== a.id) };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

const initialState: TableState = {
  trips: [],
  loading: true,
  total: 0,
  pages: 1,
  error: null,
};

// ── Main hook ──────────────────────────────────────────────────────────────
export function useTrips() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TripStatus | "">("");
  const [page, setPage]     = useState(1);
  const [notification, setNotification] = useState<TripNotification | null>(null);

  /** Show a toast for 4 seconds then auto-dismiss. */
  const notify = useCallback((n: TripNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch trips ───────────────────────────────────────────────────────────
  const loadTrips = useCallback(
    async (p: number, q: string, st: TripStatus | "") => {
      dispatch({ type: "LOAD_START" });
      try {
        const token = getStoredToken();
        const res = await tripService.getAll(
          { page: p, limit: 12, search: q || undefined, status: st || undefined },
          token,
        );
        const payload = (
          res as unknown as {
            data: {
              data: Trip[];
              pagination?: { total: number; totalPages: number };
            };
          }
        ).data ?? res;

        dispatch({
          type: "LOAD_OK",
          trips: payload.data ?? [],
          total: payload.pagination?.total ?? 0,
          pages: payload.pagination?.totalPages ?? 1,
        });
      } catch {
        dispatch({
          type: "LOAD_ERR",
          error: "تعذّر تحميل بيانات الرحلات. يرجى المحاولة مجدداً.",
        });
      }
    },
    [],
  );

  useEffect(() => {
    loadTrips(page, search, status);
  }, [page, search, status, loadTrips]);

  // ── Create ────────────────────────────────────────────────────────────────
  const createTrip = useCallback(
    async (payload: CreateTripPayload): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await tripService.create(payload, token);
        const newTrip = (res as unknown as { data: Trip }).data;
        dispatch({ type: "ADD", trip: newTrip });
        notify({ type: "success", message: "تم إضافة الرحلة بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر إضافة الرحلة.",
        });
        return false;
      }
    },
    [notify],
  );

  // ── Update ────────────────────────────────────────────────────────────────
  const updateTrip = useCallback(
    async (id: string, payload: UpdateTripPayload): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await tripService.update(id, payload, token);
        const updated = (res as unknown as { data: Trip }).data;
        dispatch({ type: "UPDATE", trip: updated });
        notify({ type: "success", message: "تم تحديث بيانات الرحلة بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر تحديث الرحلة.",
        });
        return false;
      }
    },
    [notify],
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteTrip = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const token = getStoredToken();
        await tripService.delete(id, token);
        dispatch({ type: "DELETE", id });
        notify({ type: "success", message: "تم حذف الرحلة بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر حذف الرحلة.",
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

  // ── Status filter helper ──────────────────────────────────────────────────
  const handleStatusFilter = useCallback((s: TripStatus | "") => {
    setStatus(s);
    setPage(1);
  }, []);

  return {
    ...state,
    page,
    search,
    status,
    setPage,
    handleSearch,
    handleStatusFilter,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    createTrip,
    updateTrip,
    deleteTrip,
    notification,
    reload: () => loadTrips(page, search, status),
  };
}