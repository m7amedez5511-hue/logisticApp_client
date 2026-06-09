// hooks/useDashboardSummary.ts
"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { getStoredToken } from "@/lib/auth";
import type { DashboardSummary } from "@/types/dashboard";

interface State {
  data:    DashboardSummary | null;
  error:   string | null;
  loading: boolean;
}

/**
 * Fetches the admin dashboard summary.
 * Redirects to /login if no token is present (handled by the caller).
 *
 * @example
 * const { data, loading, error } = useDashboardSummary();
 */
export function useDashboardSummary(): State {
  const [state, setState] = useState<State>({
    data: null, error: null, loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();

    if (!token) {
      setState({ data: null, error: "Unauthenticated", loading: false });
      return;
    }

    dashboardService
      .getSummary(token)
      .then(res => {
        if (!cancelled) setState({ data: res.data, error: null, loading: false });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, error: err.message, loading: false });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}