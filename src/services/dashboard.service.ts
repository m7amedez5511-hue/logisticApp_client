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

// NEW: maps an EntityKpi key to the permission slug that guards its
// underlying list endpoint. Used below to skip fetching totals the
// current user isn't allowed to read in the first place — this is what
// stops the unauthorized (401) calls from firing at all, instead of just
// hiding their result afterwards.
const ENTITY_PERMISSION_MAP: Record<string, string> = {
  users: "read-user",
  branches: "read-branch",
  roles: "read-role",
  audit: "read-audit",
};

export const dashboardService = {
  getSummary: (token: string) =>
    get<DashboardSummaryResponse>("dashboard/summary", token),

  // NOTE: /dashboard/overview isn't exposed by the backend yet, so this
  // composes the DashboardOverview shape client-side from /dashboard/summary
  // plus the users/branches/roles/audit totals fetched below, same
  // "additive, not destructive" pattern used elsewhere (see
  // useArchivedCars/useArchivedRoles) while the real route isn't live.
  //
  // CHANGE: accepts the caller's `permissions` list and only fetches a

  // resource's total if the user actually holds the matching permission.
  // Previously all four calls fired unconditionally, which flooded the
  // terminal with 401s for any user missing one of those permissions.
  getOverview: async (
    token: string | null,
    permissions: string[] = [],
  ): Promise<DashboardOverview> => {
    const can = (key: string) => permissions.includes(ENTITY_PERMISSION_MAP[key]);
    const EMPTY_LIST = { items: [], total: 0, pages: 1 };
    const EMPTY_AUDIT = { items: [], total: 0 };

    const res = await get<DashboardSummaryResponse>("dashboard/summary", token ?? "");
    const { stats, alerts, activeTrips, accountSecurity } = res.data;

    // Step 5: Fetch the four missing totals in parallel — but only for
    // resources the current user is permitted to read. Each call is still
    // defensively caught so one failing endpoint doesn't blank out the
    // other three cards.
    const [usersResult, branchesResult, rolesResult, auditResult] = await Promise.all([
      can("users")    ? userService.getAll(1, "", token).catch(() => EMPTY_LIST)   : Promise.resolve(EMPTY_LIST),
      can("branches") ? branchService.getAll(1, "", token).catch(() => EMPTY_LIST) : Promise.resolve(EMPTY_LIST),
      can("roles")    ? roleService.getAll(1, "", token).catch(() => EMPTY_LIST)   : Promise.resolve(EMPTY_LIST),
      can("audit")    ? auditService.getAll(1, 1).catch(() => EMPTY_AUDIT)         : Promise.resolve(EMPTY_AUDIT),
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