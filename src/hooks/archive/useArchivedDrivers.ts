import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedDriverService } from "@/src/services/archive/archivedDriver.service";
import type { ArchivedDriver } from "@/src/types/driver";

/**
 * Loads and paginates the archived drivers list, mirroring useArchivedUsers.
 * Re-fetches whenever `page` or `search` changes.
 */
export function useArchivedDrivers() {
  const [drivers, setDrivers] = useState<ArchivedDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  /** Fetches the current page/search slice of archived drivers from the API. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await archivedDriverService.getAll(page, search, token);
      setDrivers(res.data.data);
      setTotal(res.data.meta.total);
      setPages(res.data.meta.totalPages);
      setError(null);
    } catch {
      setError("تعذّر تحميل قائمة السائقين المؤرشفين. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  /** Updates the search term and resets to page 1. */
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    drivers, loading, total, pages, page, search, error,
    setPage, handleSearch, clearError: () => setError(null),
    refresh: load,
  };
}