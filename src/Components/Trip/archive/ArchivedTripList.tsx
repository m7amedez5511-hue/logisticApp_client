"use client";

import { Spinner, Alert, EmptyState } from "@/src/Components/UI";
import { useArchivedTrips } from "@/src/hooks/archive/useArchivedTrips";
import { TRIP_STATUS_MAP } from "@/src/types/trip";
import type { Trip } from "@/src/types/trip";

interface ArchivedTripListProps {
  /** Called when the user clicks a row to view trip details */
  onView?: (trip: Trip) => void;
}

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

/**
 * ArchivedTripList
 * Displays a paginated, searchable list of archived trips.
 * Fetches data via useArchivedTrips (GET /trip/archived), handles loading,
 * empty, and error states, and renders each trip with its key details.
 *
 * @example
 * <ArchivedTripList onView={(trip) => setViewTripId(trip.id)} />
 */
export function ArchivedTripList({ onView }: ArchivedTripListProps) {
  const {
    trips, loading, total, pages, page, search, error,
    setPage, handleSearch, clearError,
  } = useArchivedTrips();

  return (
    <div dir="rtl" className="flex flex-col gap-4">
      {/* ── Header: count + search ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">
          الرحلات المؤرشفة
          <span className="mr-2 text-[13px] font-medium text-[var(--color-text-muted)]">
            ({total})
          </span>
        </h2>

        <div className="relative w-full sm:w-72">
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-hint)]"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="بحث برقم الرحلة أو العنوان..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] pr-9 pl-3 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-600)] focus:ring-2 focus:ring-[var(--color-brand-600)]/15"
          />
        </div>
      </div>

      {/* ── API error feedback ── */}
      {error && <Alert type="error" message={error} onClose={clearError} />}

      {/* ── Card ── */}
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
                onClick={() => onView?.(trip)}
                className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center gap-2 border-b border-[var(--color-border)] px-6 py-3.5 text-[13px] transition-colors hover:bg-[var(--color-surface-muted)] ${
                  onView ? "cursor-pointer" : ""
                } ${i % 2 !== 0 ? "bg-[var(--color-surface-muted)]/40" : ""}`}
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
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-1.5 text-[12px] text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={page === pages}
                onClick={() => setPage(Math.min(pages, page + 1))}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-1.5 text-[12px] text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}