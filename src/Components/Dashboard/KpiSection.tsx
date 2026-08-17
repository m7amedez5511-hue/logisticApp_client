"use client";

import Link from "next/link";
import { Spinner } from "@/src/Components/UI";
import type { EntityKpi } from "@/src/types/dashboard";
import { ENTITY_KPI_CONFIG, EMPTY_ENTITY_KPI } from "@/src/types/dashboard";

function KpiAnomalyBadge({ anomaly }: { anomaly: EntityKpi["anomaly"] }) {
  if (!anomaly) return null;
  const isCritical = anomaly.severity === "critical";
  return (
    <div
      style={{
        marginTop: "0.75rem",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${isCritical ? "rgba(248,113,113,0.35)" : "rgba(251,191,36,0.35)"}`,
        background: isCritical ? "rgba(248,113,113,0.08)" : "rgba(251,191,36,0.08)",
        padding: "0.5rem 0.75rem",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isCritical ? "#F87171" : "#FBBF24", flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: isCritical ? "#FCA5A5" : "#FDE68A", lineHeight: 1.5 }}>
        {anomaly.message}
      </span>
    </div>
  );
}

function KpiCardCounts({ total, active, pending }: { total: number; active: number; pending: number }) {
  return (
    <div style={{ marginTop: "0.875rem" }}>
      <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-dark-primary)", fontFamily: "var(--font-mono)", margin: 0, textAlign: "start" }}>
        {total.toLocaleString("ar-SA")}
      </p>
      <div style={{ marginTop: "0.625rem", display: "flex", gap: "0.75rem" }}>
        <div style={{ flex: 1, borderRadius: "var(--radius-md)", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", padding: "0.375rem 0.625rem" }}>
          <p style={{ fontSize: 10, color: "#6EE7B7", margin: 0 }}>نشط</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#A7F3D0", margin: 0, fontFamily: "var(--font-mono)" }}>
            {active.toLocaleString("ar-SA")}
          </p>
        </div>
        <div style={{ flex: 1, borderRadius: "var(--radius-md)", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", padding: "0.375rem 0.625rem" }}>
          <p style={{ fontSize: 10, color: "#FCD34D", margin: 0 }}>معلَّق</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FDE68A", margin: 0, fontFamily: "var(--font-mono)" }}>
            {pending.toLocaleString("ar-SA")}
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ entity }: { entity: EntityKpi }) {
  return (
    <Link
      href={entity.href}
      style={{
        display: "block",
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-border-dark)",
        background: "var(--color-surface-dark-card)",
        padding: "1.25rem",
        boxShadow: "var(--shadow-card)",
        textDecoration: "none",
        transition: "transform 150ms, box-shadow 150ms",
      }}
      className="hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(6,182,212,.12)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40, height: 40, borderRadius: "var(--radius-lg)",
              background: `${entity.accent}1A`, border: `1px solid ${entity.accent}40`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <i className={`ti ti-${entity.icon}`} style={{ fontSize: 18, color: entity.accent }} aria-hidden="true" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0 }}>
            {entity.label}
          </p>
        </div>
        <i className="ti ti-chevron-left" style={{ fontSize: 14, color: "var(--color-text-dark-muted)" }} aria-hidden="true" />
      </div>

      <KpiCardCounts total={entity.total} active={entity.active} pending={entity.pending} />
      <KpiAnomalyBadge anomaly={entity.anomaly} />
    </Link>
  );
}

interface KpiSectionProps {
  entities: EntityKpi[];
  loading: boolean;
}

export function KpiSection({ entities, loading }: KpiSectionProps) {
  // Before the overview resolves, render the static config as zeroed cards
  // so the grid never collapses to nothing.
  const list = entities.length > 0 ? entities : ENTITY_KPI_CONFIG.map((cfg) => ({ ...cfg, ...EMPTY_ENTITY_KPI }));

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: "0.75rem" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#67E8F9", margin: 0 }}>
          نظرة عامة
        </p>
        {loading && <Spinner size="sm" className="text-cyan-400" />}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {list.map((entity) => (
          <KpiCard key={entity.key} entity={entity} />
        ))}
      </div>
    </div>
  );
}