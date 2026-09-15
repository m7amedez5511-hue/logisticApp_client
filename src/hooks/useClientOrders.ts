
"use client";

import { useEffect, useState } from "react";
import { clientService } from "@/src/services/client.service";
import { translateError } from "@/src/lib/translateError"; // 1. import translator
import type { Order } from "@/src/types/order";

interface State {
  orders:  Order[];
  error:   string | null;
  loading: boolean;
}

/**
 * Fetches all orders for a client session.
 *
 * @example
 * const { orders, loading, error } = useClientOrders(session.id);
 */
export function useClientOrders(clientId: string): State {
  const [state, setState] = useState<State>({
    orders: [], error: null, loading: true,
  });

  useEffect(() => {
    if (!clientId) {
      setState({ orders: [], error: null, loading: false });
      return;
    }

    let cancelled = false;

    const clientOrdersService = clientService as typeof clientService & {
      getOrders?: (clientId: string) => Promise<Order[]>;
    };

    (clientOrdersService.getOrders?.(clientId) ?? Promise.resolve([]))
      .then((orders: Order[]) => {
        if (!cancelled) setState({ orders, error: null, loading: false });
      })
      .catch((err: unknown) => {
        // 2. Normalize before showing — no raw backend text reaches the UI.
        if (!cancelled) setState({ orders: [], error: translateError(err).message, loading: false });
      });

    return () => { cancelled = true; };
  }, [clientId]);

  return state;
}