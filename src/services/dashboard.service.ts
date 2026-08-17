import { get } from "./api";
import type {
  DashboardSummaryResponse,
  DashboardOverview,
  EntityKpi,
  DashboardAlert,
} from "@/src/types/dashboard";
import { ENTITY_KPI_CONFIG, EMPTY_ENTITY_KPI } from "@/src/types/dashboard";

// Maps the stats we DO get from /dashboard/summary onto the entity cards.
// Entities with no matching stat (users, branches, roles, audit) stay at 0
// until the real /dashboard/overview endpoint exists.
function buildEntities(stats: DashboardSummaryResponse["data"]["stats"]): EntityKpi[] {
  const totals: Partial<Record<EntityKpi["key"], number>> = {
    clients: stats.clients,
    orders: stats.orders,
    trips: stats.trips,
    cars: stats.cars,
    drivers: stats.drivers,
  };

  return ENTITY_KPI_CONFIG.map((cfg) => ({
    ...cfg,
    ...EMPTY_ENTITY_KPI,
    total: totals[cfg.key] ?? 0,
  }));
}

// Flattens the 3 alert groups from /dashboard/summary into DashboardAlert[].
// AlertItem only guarantees `message`, so id/createdAt are synthesized here.
function buildAlerts(alerts: DashboardSummaryResponse["data"]["alerts"]): DashboardAlert[] {
  const now = new Date().toISOString();

  const mapGroup = (
    items: { message: string }[],
    entity: DashboardAlert["entity"],
    severity: DashboardAlert["severity"],
    prefix: string
  ): DashboardAlert[] =>
    items.map((item, i) => ({
      id: `${prefix}-${i}`,
      severity,
      message: item.message,
      entity,
      createdAt: now,
    }));

  return [
    ...mapGroup(alerts.expiringCars, "cars", "warning", "expiring-car"),
    ...mapGroup(alerts.expiringDrivers, "drivers", "warning", "expiring-driver"),
    ...mapGroup(alerts.upcomingMaint, "cars", "critical", "upcoming-maint"),
  ];
}

export const dashboardService = {
  getSummary: (token: string) =>
    get<DashboardSummaryResponse>("dashboard/summary", token),

  // NOTE: /dashboard/overview isn't exposed by the backend yet, so this
  // composes the DashboardOverview shape client-side from /dashboard/summary,
  // same "additive, not destructive" pattern used elsewhere (see
  // useArchivedCars/useArchivedRoles) while the real route isn't live.
  getOverview: async (token: string | null): Promise<DashboardOverview> => {
    const res = await get<DashboardSummaryResponse>("dashboard/summary", token ?? "");
    const { stats, alerts, activeTrips, accountSecurity } = res.data;

    return {
      entities: buildEntities(stats),
      alerts: buildAlerts(alerts),
      trends: [],           // no trend endpoint yet
      recentActivity: [],   // no audit-log endpoint composed yet
      activeTrips,
      accountSecurity,
    };
  },
};