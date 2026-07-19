"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { tripService } from "@/src/services/trip.service";
import type { Trip, TripStatus, CreateTripPayload, UpdateTripPayload } from "@/src/types/trip";

// ── Notification type ──────────────────────────────────────────────────────

export interface TripNotification {
  type: "success" | "error";
  message: string;
}

// ── API error extractor ────────────────────────────────────────────────────
// Walks common API error shapes to pull the real backend message.
// Falls back to the provided default only when nothing useful is found.

function extractApiMessage(err: unknown, fallback: string): string {
  if (typeof err === "string" && err.trim()) return err.trim();

  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;

    // Shape: { response: { data: { message: string } } }  (axios-style)
    const responseData = (e["response"] as Record<string, unknown> | undefined)?.["data"];
    if (responseData && typeof responseData === "object") {
      const rd = responseData as Record<string, unknown>;
      if (typeof rd["message"] === "string" && rd["message"].trim()) return rd["message"];
      if (Array.isArray(rd["message"])) return (rd["message"] as string[]).join(" — ");
      if (typeof rd["error"] === "string" && rd["error"].trim()) return rd["error"];
    }

    // Shape: { message: string }  (plain Error / fetch wrapper)
    if (typeof e["message"] === "string" && e["message"].trim()) return e["message"];
  }

  return fallback;
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
    case "LOAD_START":  return { ...s, loading: true, error: null };
    case "LOAD_OK":     return { ...s, loading: false, trips: a.trips, total: a.total, pages: a.pages };
    case "LOAD_ERR":    return { ...s, loading: false, error: a.error };
    case "ADD":         return { ...s, trips: [a.trip, ...s.trips], total: s.total + 1 };
    case "UPDATE":      return { ...s, trips: s.trips.map(t => (t.id === a.trip.id ? a.trip : t)) };
    case "DELETE":      return { ...s, trips: s.trips.filter(t => t.id !== a.id) };
    case "CLEAR_ERR":   return { ...s, error: null };
    default:            return s;
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

  // Ref so the dismiss timer can be cleared if a new notification arrives
  // before the previous one expires — prevents stale-closure memory leaks.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((n: TripNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(n);
    timerRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  // Clear pending timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── Fetch trips ───────────────────────────────────────────────────────────

 const loadTrips = useCallback(
  async (p: number, q: string, st: TripStatus | "") => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const { items, total, pages } = await tripService.getAll(
        { page: p, limit: 12, search: q || undefined, status: st || undefined },
        token,
      );
      dispatch({ type: "LOAD_OK", trips: items, total, pages });
    } catch (err) {
      dispatch({ type: "LOAD_ERR", error: extractApiMessage(err, "تعذّر تحميل بيانات الرحلات. يرجى المحاولة مجدداً.") });
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
      const newTrip = await tripService.create(payload, token);
      dispatch({ type: "ADD", trip: newTrip });
      notify({ type: "success", message: "تم إضافة الرحلة بنجاح." });
      return true;
    } catch (err) {
      notify({ type: "error", message: extractApiMessage(err, "تعذّر إضافة الرحلة.") });
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
      const updated = await tripService.update(id, payload, token);
      dispatch({ type: "UPDATE", trip: updated });
      notify({ type: "success", message: "تم تحديث بيانات الرحلة بنجاح." });
      return true;
    } catch (err) {
      notify({ type: "error", message: extractApiMessage(err, "تعذّر تحديث الرحلة.") });
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
        notify({ type: "error", message: extractApiMessage(err, "تعذّر حذف الرحلة.") });
        return false;
      }
    },
    [notify],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

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
    dismissNotification: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setNotification(null);
    },
    reload: () => loadTrips(page, search, status),
  };
}