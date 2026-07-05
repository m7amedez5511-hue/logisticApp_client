import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { archivedClientService } from "@/src/services/archive/archivedClient.service";
import type { ArchivedClient, ArchivedClientOrder } from "@/src/types/client";

// Handles a single archived client's detail data plus its archived orders.
// Kept separate from useArchivedClients.ts (list) since detail + orders
// share a clientId scope, mirroring how Archiveduserdetailmodal fetches
// its own record independently of the archived users list.
export function useArchivedClient(clientId: string) {
  // ── client detail ──────────────────────────────────────────────────────
  const [client, setClient] = useState<ArchivedClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const res = await archivedClientService.getById(clientId, token);
        if (!cancelled) setClient(res.data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات العميل المؤرشف. يرجى المحاولة لاحقاً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  // ── archived orders (paginated, on-demand) ─────────────────────────────
  const [orders, setOrders] = useState<ArchivedClientOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const token = getStoredToken();
      const res = await archivedClientService.getArchivedOrders(clientId, ordersPage, token);
      setOrders(res.data.data);
      setOrdersTotal(res.data.meta.total);
      setOrdersPages(res.data.meta.totalPages);
      setOrdersError(null);
    } catch {
      setOrdersError("تعذّر تحميل الطلبات المؤرشفة لهذا العميل.");
    } finally {
      setOrdersLoading(false);
    }
  }, [clientId, ordersPage]);

  useEffect(() => { queueMicrotask(loadOrders); }, [loadOrders]);

  return {
    client, loading, error,
    orders, ordersLoading, ordersError,
    ordersPage, ordersPages, ordersTotal,
    setOrdersPage,
  };
}