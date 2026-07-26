"use client";

// src/Components/Trip/TripTable.tsx
// MIGRATED to ReusableTable + ActionButtons — same props, same visual
// result as the original. StatusBadge kept custom since colors come
// dynamically from TRIP_STATUS_MAP (per-status color+dot).

import { Button, ReusableTable, ActionButtons } from "../UI";
import { TRIP_STATUS_MAP } from "@/src/types/trip";
import type { TableColumn } from "@/src/types/models";
import type { Trip } from "@/src/types/trip";

function StatusBadge({ status }: { status: Trip["status"] }) {
  const s = TRIP_STATUS_MAP[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface TripTableProps {
  trips: Trip[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
  onView: (trip: Trip) => void;
  onAddFirst: () => void;
  onPageChange: (p: number) => void;
}

export function TripTable({
  trips, loading, search, page, pages,
  onEdit, onDelete, onView, onAddFirst, onPageChange,
}: TripTableProps) {
  const columns: TableColumn<Trip>[] = [
    {
      key: "title",
      header: "الرحلة",
      width: "2fr",
      render: (t) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{t.title}</p>
          <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{t.tripNumber}</p>
        </div>
      ),
    },
    { key: "driver", header: "السائق", width: "1.3fr", render: (t) => t.driver?.name ?? "—" },
    {
      key: "car",
      header: "السيارة",
      width: "1.3fr",
      render: (t) => (t.car ? `${t.car.manufacturer} ${t.car.model}` : "—"),
    },
    { key: "branch", header: "الفرع", width: "1fr", render: (t) => t.branch?.name ?? "—" },
    { key: "status", header: "الحالة", width: "1fr", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "startTime",
      header: "معاد البداء",
      width: "1fr",
      align: "center",
      render: (t) => fmtDate(t.startTime),
    },
  ];

  return (
    <ReusableTable
      columns={columns}
      data={trips}
      loading={loading}
      search={search}
      page={page}
      pages={pages}
      onPageChange={onPageChange}
      emptyIcon="🚚"
      emptyDescription={!search ? "No trips to display." : undefined}
      emptyAction={
        !search && (
          <Button type="button" variant="ghost" size="sm" onClick={onAddFirst}>
            Add first trip
          </Button>
        )
      }
      renderActions={(t) => (
        <ActionButtons
          itemLabel={t.title}
          onView={() => onView(t)}
          onEdit={() => onEdit(t)}
          onDelete={() => onDelete(t)}
        />
      )}
    />
  );
}