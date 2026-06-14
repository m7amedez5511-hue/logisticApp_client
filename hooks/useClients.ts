"use client";
// hooks/useClients.ts
// Data-management hook for the Client module.
// Mirrors the useUsers pattern exactly:
//   useReducer for table state, server-side pagination + search,
//   notify/toast instead of alert banners.

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "../lib/auth";
import { clientService } from "../services/client.service";
import type {
  Client,
  ClientFormData,
  ClientTableAction,
  ClientTableState,
} from "../types/client";

// ── Notification (mirrors useUsers Notification) ───────────────────────────
export interface Notification {
  type: "success" | "error";
  message: string;
}

// ── Reducer ────────────────────────────────────────────────────────────────
function reducer(s: ClientTableState, a: ClientTableAction): ClientTableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return {
        ...s,
        loading: false,
        clients: a.clients,
        total: a.total,
        pages: a.pages,
      };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "ADD":
      return { ...s, clients: [a.client, ...s.clients], total: s.total + 1 };
    case "UPDATE":
      return {
        ...s,
        clients: s.clients.map((c) => (c.id === a.client.id ? a.client : c)),
      };
    case "DELETE":
      return {
        ...s,
        clients: s.clients.filter((c) => c.id !== a.id),
        total: Math.max(0, s.total - 1),
      };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

const initialState: ClientTableState = {
  clients: [],
  loading: true,
  total: 0,
  pages: 1,
  error: null,
};

// ── Main hook ──────────────────────────────────────────────────────────────
export function useClients() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [roles, setRoles] = useState<[]>([]);     // placeholder — extend if needed
  const [branches, setBranches] = useState<[]>([]); // placeholder — extend if needed

  /** Show a toast for 4 seconds then auto-dismiss — identical to useUsers. */
  const notify = useCallback((n: Notification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch clients ────────────────────────────────────────────────────────
  const loadClients = useCallback(async (p: number, q: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const res = await clientService.getAll(p, q, token);

      // Normalise both pagination shapes the backend might return
      const payload = (res as any).data ?? res;
      dispatch({
        type: "LOAD_OK",
        clients: payload.data ?? [],
        total: payload.meta?.total ?? payload.pagination?.total ?? 0,
        pages: payload.meta?.pages ?? payload.pagination?.pages ?? 1,
      });
    } catch {
      dispatch({
        type: "LOAD_ERR",
        error: "تعذّر تحميل بيانات العملاء. يرجى المحاولة مجدداً.",
      });
    }
  }, []);

  // Reload whenever page or search changes
  useEffect(() => {
    loadClients(page, search);
  }, [page, search, loadClients]);

  // ── Search helper (resets to page 1) ────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  // ── CREATE ───────────────────────────────────────────────────────────────
  const createClient = useCallback(
    async (data: ClientFormData): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await clientService.create(data, token);
        dispatch({ type: "ADD", client: res.data });
        notify({ type: "success", message: "تم إضافة العميل بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر إضافة العميل.",
        });
        return false;
      }
    },
    [notify],
  );

  // ── UPDATE ───────────────────────────────────────────────────────────────
  const updateClient = useCallback(
    async (id: string, data: ClientFormData): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await clientService.update(id, data, token);
        dispatch({ type: "UPDATE", client: res.data });
        notify({ type: "success", message: "تم تحديث بيانات العميل." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر تحديث العميل.",
        });
        return false;
      }
    },
    [notify],
  );

  // ── DELETE ───────────────────────────────────────────────────────────────
  const deleteClient = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const token = getStoredToken();
        await clientService.delete(id, token);
        dispatch({ type: "DELETE", id });
        notify({ type: "success", message: "تم حذف العميل بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر حذف العميل.",
        });
        return false;
      }
    },
    [notify],
  );

  return {
    // table state
    ...state,
    // pagination & search
    page,
    search,
    setPage,
    handleSearch,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    // CRUD
    createClient,
    updateClient,
    deleteClient,
    // toast
    notification,
    // extras (currently unused, kept for future parity with useUsers)
    roles,
    branches,
    reload: () => loadClients(page, search),
  };
}