import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedRoleService } from "@/src/services/archive/archivedRole.service";
import type { ArchivedRole } from "@/src/types/role";

const PAGE_SIZE = 10;

// ── normalize whatever shape the API actually returns into a flat array ──────
// Handles both a flat `data: ArchivedRole[]` (per the documented endpoint)
// and, defensively, a nested `data: { data: ArchivedRole[] }` shape in case
// the backend later adds pagination like the users/branches archive endpoints.
function extractList(res: unknown): ArchivedRole[] {
  const body = res as { data?: unknown } | null | undefined;
  const inner = body?.data;

  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === "object" && Array.isArray((inner as { data?: unknown }).data)) {
    return (inner as { data: ArchivedRole[] }).data;
  }
  if (Array.isArray(res)) return res as ArchivedRole[];

  // Unexpected shape — log for debugging instead of crashing the UI.
  console.error("useArchivedRoles: unexpected /role/archived response shape", res);
  return [];
}

export function useArchivedRoles() {
  // full unfiltered list as returned by the API
  const [allRoles, setAllRoles] = useState<ArchivedRole[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await archivedRoleService.getAll(token);
      setAllRoles(extractList(res));
      setError(null);
    } catch {
      setError("تعذّر تحميل قائمة الأدوار المؤرشفة. يرجى المحاولة لاحقاً.");
      setAllRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  // ── client-side search (API has no search query support) ─────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(allRoles) ? allRoles : [];
    if (!q) return list;
    return list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q),
    );
  }, [allRoles, search]);

  // ── client-side pagination (API returns the full list in one go) ──────────
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const roles = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    roles, loading, total, pages, page, search, error,
    setPage, handleSearch, clearError: () => setError(null),
    refresh: load,
  };
}