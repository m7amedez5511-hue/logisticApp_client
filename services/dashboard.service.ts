import { get } from "./api";
import type { DashboardSummaryResponse } from "../types/dashboard";

export const dashboardService = {
  getSummary: (token: string) =>
    get<DashboardSummaryResponse>("dashboard/summary", token),
};