import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedUserService } from "@/src/services/archive/archivedUser.service";
import type { ArchivedUser } from "@/src/types/user";

export function useArchivedUsers() {
  const [users, setUsers] = useState<ArchivedUser[]>([]);
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
      const res = await archivedUserService.getAll(page, search, token);
      setUsers(res.data.data);
      setTotal(res.data.meta.total);
      setPages(res.data.meta.totalPages);
      setError(null);
    } catch {
      setError("تعذّر تحميل قائمة الأرشيف. يرجى المحاولة لاحقاً.");
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
    users, loading, total, pages, page, search, error,
    setPage, handleSearch, clearError: () => setError(null),
    refresh: load,
  };
}