"use client";


import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "../lib/auth";
import { clientAddressService } from "../services/clientAddress.service";
import type {
  ClientAddress,
  ClientAddressFormData,
  AddressTableAction,
  AddressTableState,
} from "../types/client";

// ── Notification ───────────────────────────────────────────────────────────
export interface Notification {
  type: "success" | "error";
  message: string;
}

// ── Reducer ────────────────────────────────────────────────────────────────
function reducer(s: AddressTableState, a: AddressTableAction): AddressTableState {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return { ...s, loading: false, addresses: a.addresses };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "ADD":
      return { ...s, addresses: [...s.addresses, a.address] };
    case "UPDATE":
      return {
        ...s,
        addresses: s.addresses.map((a2) =>
          a2.id === a.address.id ? a.address : a2
        ),
      };
    case "DELETE":
      return {
        ...s,
        addresses: s.addresses.filter((a2) => a2.id !== a.id),
      };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

const initialState: AddressTableState = {
  addresses: [],
  loading: true,
  error: null,
};

// ── Main hook ──────────────────────────────────────────────────────────────
export function useClientAddresses(clientId: string) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [notification, setNotification] = useState<Notification | null>(null);

  /** Show a toast for 4 seconds then auto-dismiss. */
  const notify = useCallback((n: Notification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch addresses ──────────────────────────────────────────────────────
  const loadAddresses = useCallback(async () => {
    if (!clientId) return;
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const res = await clientAddressService.getAll(clientId, token);
      const payload = (res as any).data ?? res;
      dispatch({
        type: "LOAD_OK",
        addresses: Array.isArray(payload) ? payload : (payload.data ?? []),
      });
    } catch {
      dispatch({
        type: "LOAD_ERR",
        error: "تعذّر تحميل العناوين. يرجى المحاولة مجدداً.",
      });
    }
  }, [clientId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // ── CREATE ───────────────────────────────────────────────────────────────
  const createAddress = useCallback(
    async (data: ClientAddressFormData): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await clientAddressService.create(clientId, data, token);
        dispatch({ type: "ADD", address: res.data });
        notify({ type: "success", message: "تم إضافة العنوان بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر إضافة العنوان.",
        });
        return false;
      }
    },
    [clientId, notify],
  );

  // ── UPDATE ───────────────────────────────────────────────────────────────
  const updateAddress = useCallback(
    async (id: string, data: ClientAddressFormData): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await clientAddressService.update(clientId, id, data, token);
        dispatch({ type: "UPDATE", address: res.data });
        notify({ type: "success", message: "تم تحديث العنوان." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر تحديث العنوان.",
        });
        return false;
      }
    },
    [clientId, notify],
  );

  // ── DELETE ───────────────────────────────────────────────────────────────
  const deleteAddress = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const token = getStoredToken();
        await clientAddressService.delete(clientId, id, token);
        dispatch({ type: "DELETE", id });
        notify({ type: "success", message: "تم حذف العنوان بنجاح." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر حذف العنوان.",
        });
        return false;
      }
    },
    [clientId, notify],
  );

  // ── SET PRIMARY ──────────────────────────────────────────────────────────
  const makePrimary = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await clientAddressService.setPrimary(clientId, id, token);
        // Backend demotes all others — reload to sync
        dispatch({ type: "UPDATE", address: res.data });
        // Reload to reflect the backend's cascade demotions
        await loadAddresses();
        notify({ type: "success", message: "تم تعيين العنوان الرئيسي." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message: err instanceof Error ? err.message : "تعذّر تعيين العنوان الرئيسي.",
        });
        return false;
      }
    },
    [clientId, notify, loadAddresses],
  );

  return {
    ...state,
    notification,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    createAddress,
    updateAddress,
    deleteAddress,
    makePrimary,
    reload: loadAddresses,
  };
}