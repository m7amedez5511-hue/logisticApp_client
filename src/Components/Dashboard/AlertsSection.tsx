"use client";

import Link from "next/link";
import { EmptyState, Spinner } from "@/src/Components/UI";
import { ENTITY_KPI_CONFIG } from "@/src/types/dashboard";
import type { DashboardAlert } from "@/src/types/dashboard";

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

function AlertListItem({ alert }: { alert: DashboardAlert }) {
  const entityCfg = ENTITY_KPI_CONFIG.find((e) => e.key === alert.entity);
  const isCritical = alert.severity === "critical";

  return (
    <Link
      href={entityCfg?.href ?? "/dashboard"}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-dark)",
        background: "var(--color-surface-dark-raised)",
        padding: "0.75rem 1rem",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: isCritical ? "#F87171" : "#FBBF24",
          boxShadow: isCritical ? "0 0 0 4px rgba(248,113,113,0.15)" : "0 0 0 4px rgba(251,191,36,0.15)",
        }}
      />
      <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-dark-primary)", textAlign: "start" }}>
        {alert.message}
      </span>
      {entityCfg && (
        <span
          style={{
            fontSize: 10, fontWeight: 700, color: entityCfg.accent,
            background: `${entityCfg.accent}1A`, border: `1px solid ${entityCfg.accent}40`,
            borderRadius: "var(--radius-full)", padding: "0.15rem 0.55rem", whiteSpace: "nowrap",
          }}
        >
          {entityCfg.label}
        </span>
      )}
      <span style={{ fontSize: 11, color: "var(--color-text-dark-muted)", whiteSpace: "nowrap" }}>
        {fmtRelative(alert.createdAt)}
      </span>
    </Link>
  );
}

interface AlertsSectionProps {
  alerts: DashboardAlert[];
  loading: boolean;
}

export function AlertsSection({ alerts, loading }: AlertsSectionProps) {
  return (
    <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#FCA5A5", textAlign: "start" }}>
            تنبيهات عاجلة
          </p>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>
            يحتاج انتباهك
          </h2>
        </div>
        {loading && <Spinner size="sm" className="text-cyan-400" />}
      </div>

      <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {!loading && alerts.length === 0 && <EmptyState icon="✅" title="لا توجد تنبيهات حالياً" />}
        {alerts.map((alert) => (
          <AlertListItem key={alert.id} alert={alert} />
        ))}
      </div>
    </article>
  );
}