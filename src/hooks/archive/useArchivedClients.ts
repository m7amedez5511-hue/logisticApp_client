import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedClientService } from "@/src/services/archive/archivedClient.service";
import type { ArchivedClient } from "@/src/types/client";

export function useArchivedClients() {
  const [clients, setClients] = useState<ArchivedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await archivedClientService.getAll(page, search, token);
      setClients(res.data.data);
      setTotal(res.data.meta.total);
      setPages(res.data.meta.totalPages);
      setError(null);
    } catch {
      setError("تعذّر تحميل قائمة عملاء الأرشيف. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    clients, loading, total, pages, page, search, error,
    setPage, handleSearch, clearError: () => setError(null),
    refresh: load,
  };
}