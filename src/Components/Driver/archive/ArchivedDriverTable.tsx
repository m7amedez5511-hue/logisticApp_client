"use client";

import { Spinner } from "../../UI";
import { DRIVER_STATUS_MAP } from "@/src/types/driver";
import type { ArchivedDriver } from "@/src/types/driver";

// ── status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ArchivedDriver["status"] }) {
  const cfg = DRIVER_STATUS_MAP[status] ?? DRIVER_STATUS_MAP.Inactive;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: `1px solid ${cfg.border}`, background: cfg.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: cfg.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ── icon button ──────────────────────────────────────────────────────────────
function IconBtn({ onClick, title, color, bg, borderColor, children }: { onClick: () => void; title: string; color: string; bg: string; borderColor: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", border: `1px solid ${borderColor}`, background: bg, color, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 150ms" }}>
      {children}
    </button>
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

const ROW_GRID_COLUMNS = "2fr 1.5fr 1fr 1fr 1fr 100px";

// ── Props ────────────────────────────────────────────────────────────────────
interface ArchivedDriverTableProps {
  drivers:      ArchivedDriver[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onView:       (driver: ArchivedDriver) => void;
  onPageChange: (p: number) => void;
}

/**
 * Renders the paginated table of archived drivers, including loading,
 * empty, and error-free states. Mirrors ArchivedUserTable for consistency.
 */
export function ArchivedDriverTable({ drivers, loading, search, page, pages, onView, onPageChange }: ArchivedDriverTableProps) {
  return (
    <div style={cardStyle}>
      {/* column headers */}
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: ROW_GRID_COLUMNS, ...thStyle }}>
        <span>الاسم</span>
        <span>اسم المستخدم</span>
        <span>الحالة</span>
        <span style={{ textAlign: "center" }}>تاريخ الإنشاء</span>
        <span style={{ textAlign: "center" }}>آخر تحديث</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/* loading state */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : drivers.length === 0 ? (
        /* empty state */
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {search ? `لا توجد نتائج لـ "${search}"` : "لا يوجد سائقون في الأرشيف."}
          </p>
        </div>
      ) : (
        /* data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {drivers.map((d, i) => (
            <li key={d.id} onClick={() => onView(d)} style={{
              display: "grid", gridTemplateColumns: ROW_GRID_COLUMNS,
              alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
              fontSize: 13, cursor: "pointer",
            }}>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{d.name}</p>
                <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{d.phone}</p>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>{d.userName ?? "—"}</span>
              <StatusBadge status={d.status} />
              <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                {new Date(d.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                {new Date(d.updatedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                {/* view only — delete/restore not implemented yet, same as users */}
                <IconBtn title={`عرض ${d.name}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(d)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
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
            {[
              { label: "السابق", action: () => onPageChange(Math.max(1, page - 1)),     disabled: page === 1     },
              { label: "التالي", action: () => onPageChange(Math.min(pages, page + 1)), disabled: page === pages },
            ].map(btn => (
              <button key={btn.label} type="button" onClick={btn.action} disabled={btn.disabled}
                style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", padding: "0.375rem 0.875rem", fontSize: 12, color: "var(--color-text-secondary)", cursor: btn.disabled ? "not-allowed" : "pointer", opacity: btn.disabled ? 0.4 : 1, fontFamily: "var(--font-sans)" }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}