"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/src/services/dashboard.service";
import { getStoredToken } from "@/src/lib/auth";
import type { DashboardOverview } from "@/src/types/dashboard";

interface State {
  data: DashboardOverview | null;
  error: string | null;
  loading: boolean;
}

/**
 * Fetches the redesigned dashboard home overview (KPIs, alerts, trends,
 * recent activity). Kept as its own hook alongside useDashboardSummary.ts
 * rather than replacing it — same "additive, not destructive" approach
 * used elsewhere when a new backend route isn't live yet.
 */
export function useDashboardOverview(): State {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken(); // always null now — kept for the service signature

    dashboardService
      .getOverview(token)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, error: err.message, loading: false });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}