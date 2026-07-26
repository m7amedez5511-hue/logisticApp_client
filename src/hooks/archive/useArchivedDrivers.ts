import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedDriverService } from "@/src/services/archive/archivedDriver.service";
import type { ArchivedDriver } from "@/src/types/driver";
import type { ToastNotification } from "@/src/Components/UI";

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
  const [notification, setNotification] = useState<ToastNotification | null>(null);

  const notify = useCallback((n: ToastNotification) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  /** Fetches the current page/search slice of archived drivers from the API. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await archivedDriverService.getAll(page, search, token);
      setDrivers(res.data.data);
      setTotal(res.data.meta.total);
      setPages(res.data.meta.totalPages);
    } catch {
      notify({ type: "error", message: "تعذّر تحميل قائمة السائقين المؤرشفين. يرجى المحاولة لاحقاً." });
    } finally {
      setLoading(false);
    }
  }, [page, search, notify]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  /** Updates the search term and resets to page 1. */
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    drivers, loading, total, pages, page, search,
    notification,
    setPage, handleSearch, clearNotification: () => setNotification(null),
    refresh: load,
  };
}