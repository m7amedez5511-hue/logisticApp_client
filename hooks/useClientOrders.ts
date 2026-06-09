"use client";

import { useEffect, useState } from "react";
import { clientService } from "@/services/client.service";
import type { Order } from "../types/client";

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

    clientService
      .getOrders(clientId)
      .then(orders => {
        if (!cancelled) setState({ orders, error: null, loading: false });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ orders: [], error: err.message, loading: false });
      });

    return () => { cancelled = true; };
  }, [clientId]);

  return state;
}