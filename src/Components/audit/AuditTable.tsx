"use client";


import { ReusableTable } from "../UI";
import type { TableColumn } from "@/src/types/models";
import type { AuditLog } from "@/src/types/audit";

// ── Action badge — moved verbatim from app/dashboard/audit/page.tsx ─────────

const ACTION_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  CREATE: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  UPDATE: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  DELETE: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  LOGIN: { bg: "#F5F3FF", color: "#5B21B6", border: "#DDD6FE" },
  LOGOUT: { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
};

// Exported (not just used locally) so AuditDetailModal can render the same
// badge in its header instead of re-implementing the color mapping.
export function ActionBadge({ action }: { action: string }) {
  const upper = action?.toUpperCase() ?? "";
  const key =
    Object.keys(ACTION_COLORS).find((k) => upper.includes(k)) ?? "CREATE";
  const cfg = ACTION_COLORS[key];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-full)",
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {action}
    </span>
  );
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface AuditTableProps {
  logs: AuditLog[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
  onRowClick: (log: AuditLog) => void;
}

export function AuditTable({
  logs, loading, search, page, pages,
  onPageChange, onRowClick,
}: AuditTableProps) {
  const columns: TableColumn<AuditLog>[] = [
    {
      key: "action",
      header: "الإجراء",
      width: "1.5fr",
      render: (log) => (
        <div>
          <ActionBadge action={log.action} />
          {log.entityId && (
            <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-muted)" }}>
              {log.entityId.slice(0, 12)}…
            </p>
          )}
        </div>
      ),
    },
    { key: "module", header: "الوحدة", width: "1fr", render: (log) => log.module ?? "—" },
    { key: "user", header: "المستخدم", width: "1fr", render: (log) => log.userName ?? log.userId ?? "—" },
    {
      key: "ipAddress",
      header: "عنوان IP",
      width: "1.5fr",
      render: (log) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-muted)" }}>
          {log.ipAddress ?? "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "الوقت",
      width: "1fr",
      render: (log) => (
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          {fmtDateTime(log.createdAt)}
        </span>
      ),
    },
  ];

  return (
    // Now showing ALL matching logs in one request (see the page's
    // loadLogs), so instead of paging through them, the list scrolls
    // internally within a fixed max-height. `pages` will naturally stay
    // at 1 for a normal-sized result set, so ReusableTable's own pager
    // stays hidden; this wrapper is what actually gives the scroll.
    <div style={{ maxHeight: "70vh", overflowY: "auto", borderRadius: "var(--radius-xl)" }}>
      <ReusableTable
        columns={columns}
        data={logs}
        loading={loading}
        search={search}
        page={page}
        pages={pages}
        onPageChange={onPageChange}
        onRowClick={onRowClick}
        emptyDescription={search ? `لا نتائج لـ "${search}"` : "لا توجد سجلات مطابقة"}
      />
    </div>
  );
}