"use client";

import { ReusableTable } from "@/src/Components/UI";
import { TRIP_STATUS_MAP } from "@/src/types/trip";
import type { TableColumn } from "@/src/types/models";
import type { Trip } from "@/src/types/trip";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface ArchivedTripTableProps {
  trips: Trip[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  onView: (trip: Trip) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedTripTable({ trips, loading, search, page, pages, onView, onPageChange }: ArchivedTripTableProps) {
  const columns: TableColumn<Trip>[] = [
    {
      key: "title",
      header: "الرحلة",
      width: "2fr",
      render: (t) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{t.title}</p>
          <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-brand-600)" }}>{t.tripNumber}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "الحالة",
      width: "1.5fr",
      render: (t) => {
        const s = TRIP_STATUS_MAP[t.status];
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: s.color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
            {s.label}
          </span>
        );
      },
    },
    { key: "start", header: "تاريخ البداية", width: "1fr", align: "center", render: (t) => fmtDate(t.startTime) },
    { key: "end", header: "تاريخ الانتهاء", width: "1fr", align: "center", render: (t) => fmtDate(t.endTime) },
    {
      key: "cash",
      header: "المبلغ المحصل",
      width: "1fr",
      align: "center",
      render: (t) => (
        <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
          {t.totalCashCollected != null ? `${Number(t.totalCashCollected).toLocaleString("en-US")} SAR` : "—"}
        </span>
      ),
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
      onRowClick={onView}
      emptyIcon="🗄️"
      emptyDescription={search ? `No results for "${search}"` : "No archived trips."}
    />
  );
}