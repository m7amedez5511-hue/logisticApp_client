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