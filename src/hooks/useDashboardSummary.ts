// src/hooks/useDashboardSummary.ts
"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/src/services/dashboard.service";
import { getStoredToken } from "@/src/lib/auth";
import type { DashboardSummary } from "@/src/types/dashboard";

interface State {
  data:    DashboardSummary | null;
  error:   string | null;
  loading: boolean;
}

/**
 * Fetches the admin dashboard summary.
 * Auth is now enforced by the HttpOnly cookie (read server-side by the
 * proxy route) — there is no client-readable token to gate on anymore,
 * so we always attempt the request and let a 401 from the backend
 * surface as a normal error instead of short-circuiting here.
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
    const token = getStoredToken(); // always null now — kept for the service signature

    dashboardService
      .getSummary(token as unknown as string)
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