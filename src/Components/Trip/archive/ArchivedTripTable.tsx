"use client";

// src/Components/Trip/archive/ArchivedTripTable.tsx
// Split out of the old ArchivedTripList.tsx — this is just the table portion
// (headers, rows, pagination), mirroring ArchivedDriverTable.tsx. Styling is
// preserved exactly (Tailwind classes) as it was in the original file.

import { Spinner, EmptyState, Button } from "@/src/Components/UI";
import { TRIP_STATUS_MAP } from "@/src/types/trip";
import type { Trip } from "@/src/types/trip";

// ── Status badge — reuses the existing trip status color map ────────────────
function TripStatusBadge({ status }: { status: Trip["status"] }) {
  const s = TRIP_STATUS_MAP[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ── Date formatting helper ───────────────────────────────────────────────────
function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

interface ArchivedTripTableProps {
  trips:        Trip[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onView:       (trip: Trip) => void;
  onPageChange: (p: number) => void;
}

/**
 * ArchivedTripTable
 * Renders the paginated, searchable table of archived trips, including
 * loading, empty, and data-row states. Mirrors ArchivedDriverTable.tsx.
 */
export function ArchivedTripTable({ trips, loading, search, page, pages, onView, onPageChange }: ArchivedTripTableProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      {/* column headers */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        <span>الرحلة</span>
        <span>الحالة</span>
        <span className="text-center">البدء</span>
        <span className="text-center">الانتهاء</span>
        <span className="text-center">النقد المحصّل</span>
      </div>

      {/* ── Loading state ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-[var(--color-text-muted)]">
          <Spinner size="sm" />
          <span className="text-[13px]">جارٍ التحميل…</span>
        </div>
      ) : trips.length === 0 ? (
        /* ── Empty state ── */
        <EmptyState
          icon="🗄️"
          title="لا توجد رحلات مؤرشفة"
          description={search ? `لا توجد نتائج لـ "${search}"` : "لم يتم أرشفة أي رحلات بعد."}
        />
      ) : (
        /* ── Data rows ── */
        <ul className="m-0 list-none p-0">
          {trips.map((trip, i) => (
            <li
              key={trip.id}
              onClick={() => onView(trip)}
              className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center gap-2 border-b border-[var(--color-border)] px-6 py-3.5 text-[13px] transition-colors hover:bg-[var(--color-surface-muted)] cursor-pointer ${
                i % 2 !== 0 ? "bg-[var(--color-surface-muted)]/40" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="m-0 truncate font-semibold text-[var(--color-text-primary)]">{trip.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-[var(--color-brand-600)]">{trip.tripNumber}</p>
              </div>
              <div>
                <TripStatusBadge status={trip.status} />
              </div>
              <span className="text-center text-[12px] text-[var(--color-text-muted)]">
                {fmtDate(trip.startTime)}
              </span>
              <span className="text-center text-[12px] text-[var(--color-text-muted)]">
                {fmtDate(trip.endTime)}
              </span>
              <span className="text-center font-mono text-[12px] font-semibold text-[var(--color-text-primary)]">
                {trip.totalCashCollected != null
                  ? `${Number(trip.totalCashCollected).toLocaleString("ar-SA")} ر.س`
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-3.5">
          <span className="text-[12px] text-[var(--color-text-muted)]">
            صفحة <strong className="text-[var(--color-text-primary)]">{page}</strong> من{" "}
            <strong className="text-[var(--color-text-primary)]">{pages}</strong>
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              السابق
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === pages}
              onClick={() => onPageChange(Math.min(pages, page + 1))}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}