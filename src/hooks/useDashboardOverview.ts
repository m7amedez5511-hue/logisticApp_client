"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/src/services/dashboard.service";
import { getStoredToken } from "@/src/lib/auth";
import { usePermissions } from "@/src/hooks/usePermissions";
import { translateError } from "@/src/lib/translateError"; // 1. import translator
import type { DashboardOverview } from "@/src/types/dashboard";

interface State {
  data:    DashboardOverview | null;
  error:   string | null;
  loading: boolean;
}

/**
 * Fetches the redesigned dashboard home overview (KPIs, alerts, trends,
 * recent activity). Waits for the current user's permissions to resolve
 * before firing the request, and passes them along so dashboardService
 * can skip any sub-call the user isn't authorized for.
 */
export function useDashboardOverview(): State {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });
  const { permissions, permissionsKey, loading: permsLoading } = usePermissions();

  useEffect(() => {
    if (permsLoading) return; // wait until permissions are known
    let cancelled = false;
    const token = getStoredToken(); // always null now — kept for the service signature

    dashboardService
      .getOverview(token, permissions)

      .then(res => {
        if (!cancelled) setState({ data: res, error: null, loading: false });
      })
      .catch((err: unknown) => {
        // 2. Normalize before showing — no raw backend text reaches the UI.
        if (!cancelled) setState({ data: null, error: translateError(err).message, loading: false });
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsKey, permsLoading]);

  return state;
}