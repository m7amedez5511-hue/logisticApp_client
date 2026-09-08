import { get } from "./api";
import type {
  DashboardSummaryResponse,
  DashboardOverview,
  EntityKpi,
  DashboardAlert,
} from "@/src/types/dashboard";
import { ENTITY_KPI_CONFIG, EMPTY_ENTITY_KPI } from "@/src/types/dashboard";
// Step 3: Reuse the exact same services already used by UserTable,
// BranchTable, and RoleTable (via useUsers/useBranches/useRoles) instead of
// writing new fetch logic — this keeps the dashboard's data-fetching
// pattern identical to the rest of the app, per the task instructions.
import { userService } from "./user.service";
import { branchService } from "./branch.service";
import { roleService } from "./role.service";
import { auditService } from "./audit.service";

// Step 4: buildEntities now takes a second argument with the totals that
// don't come from /dashboard/summary (users, branches, roles, audit) and
// merges them into the same totals map the clients/orders/trips/cars/
// drivers stats already flow through — no change to the entity list shape
// or ordering (ENTITY_KPI_CONFIG is untouched), so layout stays identical.
function buildEntities(
  stats: DashboardSummaryResponse["data"]["stats"],
  extraTotals: { users: number; branches: number; roles: number; audit: number },
): EntityKpi[] {
  const totals: Partial<Record<EntityKpi["key"], number>> = {
    clients: stats.clients,
    orders: stats.orders,
    trips: stats.trips,
    cars: stats.cars,
    drivers: stats.drivers,

    users: extraTotals.users,
    branches: extraTotals.branches,
    roles: extraTotals.roles,
    audit: extraTotals.audit,
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
  // composes the DashboardOverview shape client-side from /dashboard/summary
  // plus the users/branches/roles/audit totals fetched below, same
  // "additive, not destructive" pattern used elsewhere (see
  // useArchivedCars/useArchivedRoles) while the real route isn't live.
  getOverview: async (token: string | null): Promise<DashboardOverview> => {
    const res = await get<DashboardSummaryResponse>("dashboard/summary", token ?? "");
    const { stats, alerts, activeTrips, accountSecurity } = res.data;

    // Step 5: Fetch the four missing totals in parallel (mirrors the
    // Promise.all-free-but-concurrent pattern already used in
    // OrderFormModal, which loads clients + trips together for the same
    // modal mount). page=1 + empty search is exactly what UserTable /
    // BranchTable / RoleTable already send on first load — we just read
    // back `.total` and discard the `.items` page since the KPI card only
    // needs the count. Each call is defensively caught so one failing
    // endpoint doesn't blank out the other three cards.
    const [usersResult, branchesResult, rolesResult, auditResult] = await Promise.all([
      userService.getAll(1, "", token).catch(() => ({ items: [], total: 0, pages: 1 })),
      branchService.getAll(1, "", token).catch(() => ({ items: [], total: 0, pages: 1 })),
      roleService.getAll(1, "", token).catch(() => ({ items: [], total: 0, pages: 1 })),

      auditService.getAll(1, 1).catch(() => ({ items: [], total: 0 })),
    ]);

    return {
      entities: buildEntities(stats, {
        users: usersResult.total,
        branches: branchesResult.total,
        roles: rolesResult.total,
        audit: auditResult.total,
      }),
      alerts: buildAlerts(alerts),
      trends: [],           // no trend endpoint yet
      recentActivity: [],   // no audit-log endpoint composed yet
      activeTrips,
      accountSecurity,
    };
  },
};