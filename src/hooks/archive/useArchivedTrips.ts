import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedTripService } from "@/src/services/archive/archivedTrip.service";
import type { Trip } from "@/src/types/trip";

export function useArchivedTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ── Load archived trips for the current page/search ───────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await archivedTripService.getAll(page, search, token);
      setTrips(res.data.data);
      setTotal(res.data.meta.total);
      setPages(res.data.meta.totalPages);
      setError(null);
    } catch {
      // Network/API failure — surface a friendly Arabic message, matching useArchivedUsers
      setError("تعذّر تحميل قائمة الرحلات المؤرشفة. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    trips, loading, total, pages, page, search, error,
    setPage, handleSearch, clearError: () => setError(null),
    refresh: load,
  };
}