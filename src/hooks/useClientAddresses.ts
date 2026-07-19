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
import { Notification } from "../types/notif";

function normalizeAddress(raw: unknown): ClientAddress {
  const data = raw as { id?: string; _id?: string; [key: string]: unknown };

  // FIXED: fallback to "" so the type is always `string`, never `string | undefined`
  const id = data.id ?? data._id ?? "";

  return {
    ...data,
    id,
  } as ClientAddress;
}

function normalizeAddresses(rawList: unknown[]): ClientAddress[] {
  return rawList.map(normalizeAddress);
}

// ── Reducer ────────────────────────────────────────────────────────────────
function reducer(
  s: AddressTableState,
  a: AddressTableAction,
): AddressTableState {
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
          a2.id === a.address.id ? a.address : a2,
        ),
      };
    case "DELETE":
      return {
        ...s,
        addresses: s.addresses.filter((a2) => a2.id !== a.id),
      };
    case "CLEAR_ERR":
      return { ...s, error: null };
    case "SET_PRIMARY":
      return {
        ...s,
        addresses: s.addresses.map((addr) => ({
          ...addr,
          isPrimary: addr.id === a.id,
        })),
      };
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
  // Tracks which address is mid-request so its button can disable itself
  // and duplicate clicks are ignored while a request is in flight.
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

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
      const addresses = await clientAddressService.getAllNormalized(
        clientId,
        token,
      );
      dispatch({ type: "LOAD_OK", addresses });
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
        dispatch({ type: "ADD", address: normalizeAddress(res.data as any) });
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
        const res = await clientAddressService.update(
          clientId,
          id,
          data,
          token,
        );
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

  // ── SET PRIMARY ──────────────────────────────────────────────────────────
  const setPrimaryAddress = useCallback(
    async (id: string): Promise<boolean> => {
      if (settingPrimaryId) return false; // guard against overlapping requests
      setSettingPrimaryId(id);
      try {
        const token = getStoredToken();
        await clientAddressService.setPrimary(id, token);
        // We already know the shape of the change (target -> true, everyone
        // else -> false), so we update local state directly instead of
        // refetching the whole list.
        dispatch({ type: "SET_PRIMARY", id });
        notify({ type: "success", message: "تم تعيين العنوان كعنوان أساسي." });
        return true;
      } catch (err) {
        notify({
          type: "error",
          message:
            err instanceof Error ? err.message : "تعذّر تعيين العنوان كأساسي.",
        });
        return false;
      } finally {
        setSettingPrimaryId(null);
      }
    },
    [notify, settingPrimaryId],
  );

  return {
    ...state,
    notification,
    clearError: () => dispatch({ type: "CLEAR_ERR" }),
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
    settingPrimaryId,
    reload: loadAddresses,
  };
}
