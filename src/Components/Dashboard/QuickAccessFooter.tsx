"use client";

import Link from "next/link";
import { ENTITY_KPI_CONFIG } from "@/src/types/dashboard";

export function QuickAccessFooter() {
  return (
    <div
      style={{
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-border-dark)",
        background: "var(--color-surface-dark-card)",
        padding: "1rem 1.25rem",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        gap: "0.625rem",
        overflowX: "auto",
      }}
    >
      {ENTITY_KPI_CONFIG.map((entity) => (
        <Link
          key={entity.key}
          href={entity.href}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border-dark)",
            background: "var(--color-surface-dark-raised)",
            padding: "0.45rem 0.875rem",
            fontSize: 12, fontWeight: 600,
            color: "var(--color-text-dark-primary)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          <i className={`ti ti-${entity.icon}`} style={{ fontSize: 14, color: entity.accent }} aria-hidden="true" />
          {entity.label}
        </Link>
      ))}
    </div>
  );
}