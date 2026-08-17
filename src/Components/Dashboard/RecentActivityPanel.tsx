"use client";

import Link from "next/link";
import { EmptyState, Spinner } from "@/src/Components/UI";
import { ActionBadge } from "@/src/Components/audit/AuditTable";
import type { AuditLog } from "@/src/types/audit";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

function ActivityItem({ log }: { log: AuditLog }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-dark)",
        background: "var(--color-surface-dark-raised)",
        padding: "0.75rem 1rem",
      }}
    >
      <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
        <ActionBadge action={log.action} />
        <p style={{ fontSize: 12, color: "var(--color-text-dark-primary)", margin: 0, textAlign: "start" }}>
          {log.userName ?? log.userId ?? "نظام"}{log.module ? ` — ${log.module}` : ""}
        </p>
      </div>
      <span style={{ fontSize: 11, color: "var(--color-text-dark-muted)", whiteSpace: "nowrap" }}>
        {fmtDateTime(log.createdAt)}
      </span>
    </div>
  );
}

interface RecentActivityPanelProps {
  logs: AuditLog[];
  loading: boolean;
}

export function RecentActivityPanel({ logs, loading }: RecentActivityPanelProps) {
  return (
    <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C4B5FD", textAlign: "start" }}>
            سجل النشاط
          </p>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>
            آخر الأنشطة
          </h2>
        </div>
        {loading && <Spinner size="sm" className="text-cyan-400" />}
      </div>

      <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {!loading && logs.length === 0 && <EmptyState icon="🕘" title="لا يوجد نشاط حديث" />}
        {logs.slice(0, 8).map((log) => (
          <ActivityItem key={log.id} log={log} />
        ))}
      </div>

      {logs.length > 0 && (
        <Link href="/dashboard/audit" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: "1rem", fontSize: 12, fontWeight: 600, color: "#67E8F9", textDecoration: "none" }}>
          عرض سجل التدقيق بالكامل
          <i className="ti ti-arrow-left" style={{ fontSize: 12 }} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}