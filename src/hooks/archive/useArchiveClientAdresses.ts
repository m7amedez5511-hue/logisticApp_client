import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedClientAddressService } from "@/src/services/archive/archivedClientAdresses.service";
import type { ArchivedClientAddress } from "@/src/types/client_adresses";

/**
 * Loads every archived address in one shot (the API has no pagination for
 * this endpoint) and applies client-side scoping/search, mirroring the
 * loading/error/search contract of useArchivedUsers / useArchivedClients.
 *
 * @param clientId  Optional — when provided, only addresses belonging to
 *                  that client are returned. Omit to browse the full
 *                  cross-client archive.
 */
export function useArchivedClientAddresses(clientId?: string) {
  const [addresses, setAddresses] = useState<ArchivedClientAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

const load = useCallback(async () => {
  setLoading(true);
  try {
    const token = getStoredToken();
    setAddresses(await archivedClientAddressService.getAllUnwrapped(token));
    setError(null);
  } catch {
    setError("تعذّر تحميل أرشيف العناوين. يرجى المحاولة لاحقاً.");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  // ── client-side scoping + search (no server support for either) ────────
  const filtered = useMemo(() => {
    let list = addresses;
    if (clientId) list = list.filter((a) => a.clientId === clientId);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.details.city.toLowerCase().includes(q) ||
          (a.branchName ?? "").toLowerCase().includes(q) ||
          (a.contactPerson?.name ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [addresses, clientId, search]);

  return {
    addresses: filtered,
    total: filtered.length,
    loading,
    error,
    search,
    handleSearch: setSearch,
    clearError: () => setError(null),
    refresh: load,
  };
}