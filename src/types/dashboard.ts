export interface DashboardStats {
  clients: number;
  orders: number;
  trips: number;
  cars: number;
  drivers: number;
}


export interface ActiveTrip {
  id: string;
  tripNumber: string;
  title: string;
  progress: number;
}

export interface AccountSecurity {
  lastLogin: string | null;
  requestMeta: Record<string, unknown> | null;
}

export interface DashboardSummary {
  stats: DashboardStats;
  alerts: {
    expiringCars: AlertItem[];
    expiringDrivers: AlertItem[];
    upcomingMaint: AlertItem[];
  };
  activeTrips: ActiveTrip[];
  accountSecurity: AccountSecurity;
}

export interface DashboardSummaryResponse {
  success: boolean;
  message: string;
  data: DashboardSummary;
}
export interface DashboardStats {
  clients: number;
  orders: number;
  trips: number;
  cars: number;
  drivers: number;
}

export interface AlertItem {
  message: string;
  [key: string]: unknown;
}

export interface ActiveTrip {
  id: string;
  tripNumber: string;
  title: string;
  progress: number;
}

export interface AccountSecurity {
  lastLogin: string | null;
  requestMeta: Record<string, unknown> | null;
}

export interface DashboardSummary {
  stats: DashboardStats;
  alerts: {
    expiringCars: AlertItem[];
    expiringDrivers: AlertItem[];
    upcomingMaint: AlertItem[];
  };
  activeTrips: ActiveTrip[];
  accountSecurity: AccountSecurity;
}

export interface DashboardSummaryResponse {
  success: boolean;
  message: string;
  data: DashboardSummary;
}

// ── Overview (home page redesign) ────────────────────────────────────────
// NOTE: /dashboard/overview isn't exposed by the backend yet — see the
// redesign plan doc. dashboardService.getOverview() composes this shape
// client-side from endpoints we already call elsewhere, same pattern as
// useArchivedCars/useArchivedRoles aggregating client-side around a
// missing backend route.

import type { AuditLog } from "./audit";

export type DashboardEntityKey =
  | "users" | "drivers" | "cars" | "trips" | "orders"
  | "clients" | "branches" | "roles" | "audit";

export interface EntityKpi {
  key: DashboardEntityKey;
  label: string;
  /** tabler icon suffix only, e.g. "car" -> rendered as `ti ti-car` */
  icon: string;
  /** hex used for the icon chip + accent strip */
  accent: string;
  href: string;
  total: number;
  active: number;
  pending: number;
  anomaly: {
    severity: "warning" | "critical";
    message: string;
  } | null;
}

export const EMPTY_ENTITY_KPI: Pick<EntityKpi, "total" | "active" | "pending" | "anomaly"> = {
  total: 0,
  active: 0,
  pending: 0,
  anomaly: null,
};

export interface DashboardAlert {
  id: string;
  severity: "warning" | "critical";
  message: string;
  entity: DashboardEntityKey;
  createdAt: string;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface TrendSeries {
  key: string;
  title: string;
  points: TrendPoint[];
  deltaPercent: number;
}

export interface DashboardOverview {
  entities: EntityKpi[];
  alerts: DashboardAlert[];
  trends: TrendSeries[];
  recentActivity: AuditLog[];
  activeTrips: ActiveTrip[];
  accountSecurity: AccountSecurity;
}

// Static entity config — icon/label/href/accent defined exactly once,
// shared by KpiSection and QuickAccessFooter (per the redesign plan).
export const ENTITY_KPI_CONFIG: Array<Pick<EntityKpi, "key" | "label" | "icon" | "accent" | "href">> = [
  { key: "users",    label: "المستخدمون", icon: "users",          accent: "#818CF8", href: "/dashboard/users" },
  { key: "drivers",  label: "السائقون",   icon: "steering-wheel", accent: "#FBBF24", href: "/dashboard/drivers" },
  { key: "cars",     label: "المركبات",   icon: "car",            accent: "#34D399", href: "/dashboard/cars" },
  { key: "trips",    label: "الرحلات",    icon: "route",          accent: "#06B6D4", href: "/dashboard/trips" },
  { key: "orders",   label: "الطلبات",    icon: "package",        accent: "#A78BFA", href: "/dashboard/orders" },
  { key: "clients",  label: "العملاء",    icon: "user-circle",    accent: "#F472B6", href: "/dashboard/clients" },
  { key: "branches", label: "الفروع",     icon: "building-store", accent: "#60A5FA", href: "/dashboard/branches" },
  { key: "roles",    label: "الأدوار",    icon: "shield-lock",    accent: "#F87171", href: "/dashboard/roles" },
  { key: "audit",    label: "التدقيق",    icon: "report-money",   accent: "#FDE68A", href: "/dashboard/audit" },
];