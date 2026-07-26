// src/Components/UI/ModelCard.tsx
//
// Optional thin wrapper matching the "card with a title row above a table"
// shape used e.g. around ArchivedTripList's header, OrderComponent's
// header, and the various archive modals (count + search + table).
// It intentionally does NOT duplicate Header.tsx (the full page-level
// title/search/add-button bar already used on every dashboard page) —
// it's a lighter-weight wrapper for cases where you just need a labeled
// card around a <ReusableTable/>, e.g. inside a modal or detail panel.
//
// Usage:
//   <ModelCard title="Orders" count={total} countLabel="orders" action={<SearchBox />}>
//     <ReusableTable columns={columns} data={orders} ... />
//   </ModelCard>

import type { ModelCardProps } from "@/src/types/models";

export function ModelCard({ title, count, countLabel, action, children }: ModelCardProps) {
  const hasHeader = title || count !== undefined || action;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {hasHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {(title || count !== undefined) && (
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              {title}
              {count !== undefined && (
                <span
                  style={{
                    marginInlineStart: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text-muted)",
                  }}
                >
                  ({count}{countLabel ? ` ${countLabel}` : ""})
                </span>
              )}
            </h2>
          )}
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}

      {children}
    </div>
  );
}