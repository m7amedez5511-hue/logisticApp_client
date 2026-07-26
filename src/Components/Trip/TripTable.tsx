"use client";

// src/Components/Trip/TripTable.tsx
// New — split out of the old single-file Trip module, mirroring
// UserTable.tsx for consistency.

import { Button, EmptyState, IconBtn, Spinner } from "../UI";
import { TRIP_STATUS_MAP } from "@/src/types/trip";
import type { Trip } from "@/src/types/trip";

// ── status badge ─────────────────────────────────────────────────────────────
// Kept custom rather than swapped for <Badge/>: colors come dynamically from
// TRIP_STATUS_MAP (per-status color+dot), which Badge's fixed palette
// doesn't cover — mirrors DriverTable's StatusBadge.
function StatusBadge({ status }: { status: Trip["status"] }) {
  const s = TRIP_STATUS_MAP[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
}

// ── card / header styles ─────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
  background: "var(--color-surface)", overflow: "hidden", boxShadow: "var(--shadow-card)",
};
const thStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.2em",
  color: "var(--color-text-muted)", background: "var(--color-surface-muted)",
  borderBottom: "1px solid var(--color-border)",
};

const ROW_GRID_COLUMNS = "2fr 1.3fr 1.3fr 1fr 1fr 1fr 100px";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

// ── Props ────────────────────────────────────────────────────────────────────
interface TripTableProps {
  trips:        Trip[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onEdit:       (trip: Trip) => void;
  onDelete:     (trip: Trip) => void;
  onView:       (trip: Trip) => void;
  onAddFirst:   () => void;
  onPageChange: (p: number) => void;
}

// ── main table ───────────────────────────────────────────────────────────────
export function TripTable({ trips, loading, search, page, pages, onEdit, onDelete, onView, onAddFirst, onPageChange }: TripTableProps) {
  return (
    <div style={cardStyle}>
      {/* column headers */}
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: ROW_GRID_COLUMNS, ...thStyle }}>
        <span>الرحلة</span>
        <span>السائق</span>
        <span>السيارة</span>
        <span>الفرع</span>
        <span>الحالة</span>
        <span style={{ textAlign: "center" }}>وقت البدء</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/* loading state */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : trips.length === 0 ? (
        /* empty state */
        <EmptyState
          icon="🚚"
          title={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد رحلات لعرضها."}
          action={
            !search && (
              <Button type="button" variant="ghost" size="sm" onClick={onAddFirst}>
                أضف أول رحلة
              </Button>
            )
          }
        />
      ) : (
        /* data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {trips.map((t, i) => (
            <li key={t.id} style={{
              display: "grid", gridTemplateColumns: ROW_GRID_COLUMNS,
              alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
              fontSize: 13,
            }}>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{t.title}</p>
                <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{t.tripNumber}</p>
              </div>
              <span style={{ color: "var(--color-text-secondary)" }}>{t.driver?.name ?? "—"}</span>
              <span style={{ color: "var(--color-text-secondary)" }}>{t.car ? `${t.car.manufacturer} ${t.car.model}` : "—"}</span>
              <span style={{ color: "var(--color-text-secondary)" }}>{t.branch?.name ?? "—"}</span>
              <StatusBadge status={t.status} />
              <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                {fmtDate(t.startTime)}
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                {/* view */}
                <IconBtn title={`عرض ${t.title}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(t)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </IconBtn>
                {/* edit */}
                <IconBtn title={`تعديل ${t.title}`} color="#1D4ED8" bg="#EFF6FF" borderColor="#BFDBFE" onClick={() => onEdit(t)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </IconBtn>
                {/* delete */}
                <IconBtn title={`حذف ${t.title}`} color="#DC2626" bg="#FEF2F2" borderColor="#FECACA" onClick={() => onDelete(t)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* pagination */}
      {pages > 1 && (
        <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.5rem" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            صفحة <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
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