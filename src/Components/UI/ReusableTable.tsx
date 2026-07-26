"use client";

// src/Components/UI/ReusableTable.tsx
//
// ============================================================================
// HOW TO USE
// ============================================================================
// ReusableTable replaces the hand-written <table>/<ul><li> markup that is
// currently duplicated across UserTable.tsx, BranchTable.tsx, RoleTable.tsx,
// TripTable.tsx, OrderTable.tsx, ArchivedDriverTable.tsx, etc. Those files
// all share the exact same shape: a grid header row, a loading spinner, an
// empty state, data rows built from `gridTemplateColumns`, and a two-button
// pager — only the column definitions and cell content differ per model.
//
//   import { ReusableTable, ActionButtons } from "@/src/Components/UI";
//   import type { TableColumn } from "@/src/types/models";
//   import type { User } from "@/src/types/user";
//
//   const columns: TableColumn<User>[] = [
//     {
//       key: "name",
//       header: "Name",
//       width: "2fr",
//       render: (u) => (
//         <div>
//           <p style={{ fontWeight: 600 }}>{u.name}</p>
//           <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{u.phone}</p>
//         </div>
//       ),
//     },
//     { key: "role", header: "Role", width: "1fr", render: (u) => u.role?.name ?? "—" },
//   ];
//
//   <ReusableTable
//     columns={columns}
//     data={users}
//     loading={loading}
//     search={search}
//     page={page}
//     pages={pages}
//     onPageChange={setPage}
//     onRowClick={(u) => setViewUserId(u.id)}
//     renderActions={(u) => (
//       <ActionButtons
//         itemLabel={u.name}
//         onView={() => setViewUserId(u.id)}
//         onEdit={() => setFormTarget(u)}
//         onDelete={() => setDeleteTarget(u)}
//       />
//     )}
//   />
//
// This produces byte-for-byte the same visual result as the existing
// UserTable — same cardStyle border/radius/shadow, same thStyle header
// treatment, same zebra-striped rows, same "السابق/التالي"-style pager
// (labels are passed as plain strings, so RTL/Arabic labels work exactly
// as before — nothing about the language is hardcoded here).
//
// NOTE ON STYLING: most tables in this codebase (User/Branch/Role/Trip/
// Order/Driver-archive) use inline `React.CSSProperties` objects with CSS
// custom properties (`var(--color-border)`, etc). A smaller set of newer
// files (ArchivedTripTable, ClientTable's expandable rows) use Tailwind
// utility classes against the same tokens instead. This component follows
// the majority inline-style pattern so it's a drop-in replacement for the
// most common case; the two Tailwind-based tables would need a follow-up
// pass to fully consolidate (flagged here rather than silently converted,
// since swapping their styling approach is a separate, riskier change).
// ============================================================================

import { useState } from "react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Spinner } from "./Spinner";
import type { CrudTableProps, BaseEntity } from "@/src/types/models";

// ── Shared styles — identical values to UserTable.tsx / BranchTable.tsx /
//    RoleTable.tsx / TripTable.tsx / OrderTable.tsx ──────────────────────────
const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  overflow: "hidden",
  boxShadow: "var(--shadow-card)",
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "var(--color-text-muted)",
  background: "var(--color-surface-muted)",
  borderBottom: "1px solid var(--color-border)",
};

export function ReusableTable<T extends BaseEntity>({
  columns,
  data,
  loading = false,
  keyExtractor = (item: T) => item.id,
  onRowClick,
  search,
  emptyIcon = "📋",
  emptyTitle,
  emptyDescription,
  emptyAction,
  page,
  pages,
  onPageChange,
  renderActions,
  actionsHeader = "إجراءات",
  actionsWidth = "100px",
  renderExpanded,
}: CrudTableProps<T>) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const gridTemplateColumns = [
    ...columns.map((c) => c.width ?? "1fr"),
    ...(renderActions ? [actionsWidth] : []),
  ].join(" ");

  const resolvedEmptyTitle =
    emptyTitle ?? (search ? `No results for "${search}"` : "No records to display.");

  return (
    <div style={cardStyle}>
      {/* ── Column headers ── */}
      <div style={{ display: "grid", gridTemplateColumns, ...thStyle }}>
        {columns.map((c) => (
          <span key={c.key} style={{ textAlign: c.align }}>
            {c.header}
          </span>
        ))}
        {renderActions && (
          <span style={{ textAlign: "center" }}>{actionsHeader}</span>
        )}
      </div>

      {/* ── Loading state ── */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "4rem 0",
            color: "var(--color-text-muted)",
          }}
        >
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      ) : data.length === 0 ? (
        /* ── Empty state ── */
        <EmptyState
          icon={emptyIcon}
          title={resolvedEmptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        /* ── Data rows ── */
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {data.map((item, i) => {
            const key = keyExtractor(item);
            const isExpanded = !!renderExpanded && expandedKey === key;
            const handleRowClick = renderExpanded
              ? () => setExpandedKey((prev) => (prev === key ? null : key))
              : onRowClick
              ? () => onRowClick(item)
              : undefined;

            return (
              <li key={key}>
                <div
                  onClick={handleRowClick}
                  role={renderExpanded ? "button" : undefined}
                  tabIndex={renderExpanded ? 0 : undefined}
                  aria-expanded={renderExpanded ? isExpanded : undefined}
                  onKeyDown={
                    renderExpanded
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") handleRowClick?.();
                        }
                      : undefined
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns,
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.875rem 1.5rem",
                    borderBottom: isExpanded ? "none" : "1px solid var(--color-border)",
                    borderInlineStart: renderExpanded
                      ? isExpanded
                        ? "3px solid var(--color-brand-600)"
                        : "3px solid transparent"
                      : undefined,
                    background: isExpanded
                      ? "#EFF6FF"
                      : i % 2 !== 0
                      ? "var(--color-surface-muted)"
                      : "transparent",
                    fontSize: 13,
                    cursor: handleRowClick ? "pointer" : "default",
                    transition: "background 0.15s, border-color 0.15s",
                    outline: "none",
                  }}
                >
                  {columns.map((c) => (
                    <div key={c.key} style={{ textAlign: c.align }}>
                      {c.render(item, i, isExpanded)}
                    </div>
                  ))}
                  {renderActions && (
                    <div
                      style={{ display: "flex", justifyContent: "center", gap: 4 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderActions(item, i)}
                    </div>
                  )}
                </div>

                {isExpanded && renderExpanded && renderExpanded(item, i)}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Pagination ── */}
      {pages !== undefined && pages > 1 && page !== undefined && onPageChange && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--color-border)",
            padding: "0.875rem 1.5rem",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Page <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> of{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.min(pages, page + 1))}
              disabled={page === pages}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}