"use client";

import { Button, EmptyState, IconBtn, Spinner } from "../../UI";
import { STATUS_MAP, fmtDateShort } from "@/src/types/car";
import type { Car } from "@/src/types/car";

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

// ── Props ────────────────────────────────────────────────────────────────────
interface ArchivedCarTableProps {
  cars:         Car[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onView:       (car: Car) => void;
  onPageChange: (p: number) => void;
}

// ── main table ───────────────────────────────────────────────────────────────
export function ArchivedCarTable({ cars, loading, search, page, pages, onView, onPageChange }: ArchivedCarTableProps) {
  return (
    <div style={cardStyle}>
      {/* column headers */}
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 100px", ...thStyle }}>
        <span>المركبة</span>
        <span>رقم اللوحة</span>
        <span>الفرع</span>
        <span>آخر حالة</span>
        <span style={{ textAlign: "center" }}>تاريخ الإضافة</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/* loading state */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : cars.length === 0 ? (
        /* empty state */
        <EmptyState
          icon="🚗"
          title={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد مركبات في الأرشيف."}
        />
      ) : (
        /* data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {cars.map((c, i) => {
            const status = STATUS_MAP[c.currentStatus];
            return (
              <li key={c.id} style={{
                display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 100px",
                alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                fontSize: 13,
              }}>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                    {c.manufacturer} {c.model}
                  </p>
                  <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>{c.year}{c.color ? ` · ${c.color}` : ""}</p>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                  {c.plateLetters} {c.plateNumber}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>{c.branch?.name ?? "—"}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: `1px solid ${status.border}`, background: status.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 700, color: status.color, width: "fit-content" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.dot }} />
                  {status.label}
                </span>
                <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                  {fmtDateShort(c.createdAt)}
                </span>
                <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                  {/* view only — delete/restore not implemented yet */}
                  <IconBtn title={`عرض ${c.manufacturer} ${c.model}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(c)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </IconBtn>
                </div>
              </li>
            );
          })}
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
              <Button
                key={btn.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={btn.action}
                disabled={btn.disabled}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}