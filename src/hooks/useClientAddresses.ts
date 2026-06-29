"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { clientAddressService } from "@/src/services/clientAddress.service";
import type {
  CreateAddressFormValues,
  UpdateAddressFormValues,
} from "@/src/validations/client_address.validator";

import type {
  AddressTableAction,
  AddressTableState,
  ClientAddress,
} from "../types/client_adresses";

// ── Notification ───────────────────────────────────────────────────────────
export interface Notification {
  type: "success" | "error";
  message: string;
}

function normalizeAddress(raw: any): ClientAddress {
  return {
    ...raw,
    id: raw.id ?? raw._id,
  };
}

function normalizeAddresses(rawList: any[]): ClientAddress[] {
  return rawList.map(normalizeAddress);
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

  const notify = useCallback((n: Notification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const loadAddresses = useCallback(async () => {
    if (!clientId) return;
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      const res = await clientAddressService.getAll(clientId, token);
      const payload = (res as any).data ?? res;
      const rawList = Array.isArray(payload) ? payload : (payload.data ?? []);
      dispatch({
        type: "LOAD_OK",
        addresses: normalizeAddresses(rawList),
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
    async (data: CreateAddressFormValues): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await clientAddressService.create(clientId, data, token);
        dispatch({ type: "ADD", address: normalizeAddress(res.data) });
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
    async (id: string, data: UpdateAddressFormValues): Promise<boolean> => {
      try {
        const token = getStoredToken();
        const res = await clientAddressService.update(clientId, id, data, token);
        dispatch({ type: "UPDATE", address: normalizeAddress(res.data) });
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

  return {
    ...state,
    notification,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    createAddress,
    updateAddress,
    deleteAddress,
    reload: loadAddresses,
  };
}