"use client";

import { Button, EmptyState, IconBtn, Spinner } from "../../UI";
import type { ArchivedRole } from "@/src/types/role";

// ── status badge ─────────────────────────────────────────────────────────────
// Kept custom rather than swapped for <Badge/>: Badge only renders a label
// pill (no dot indicator), and the pulse-dot is the whole point of this chip.
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: active ? "1px solid #BBF7D0" : "1px solid #FECACA", background: active ? "#DCFCE7" : "#FEF2F2", padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: active ? "#166534" : "#991B1B" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "نشط" : "معطل"}
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

// ── Props ────────────────────────────────────────────────────────────────────
interface ArchivedRoleTableProps {
  roles:        ArchivedRole[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onView:       (role: ArchivedRole) => void;
  onPageChange: (p: number) => void;
}

// ── main table ───────────────────────────────────────────────────────────────
export function ArchivedRoleTable({ roles, loading, search, page, pages, onView, onPageChange }: ArchivedRoleTableProps) {
  return (
    <div style={cardStyle}>
      {/* column headers */}
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 100px", ...thStyle }}>
        <span>الدور</span>
        <span>الوصف</span>
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
      ) : roles.length === 0 ? (
        /* empty state */
        <EmptyState
          icon="🛡️"
          title={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد أدوار في الأرشيف."}
        />
      ) : (
        /* data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {roles.map((r, i) => (
            <li key={r.id} style={{
              display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 100px",
              alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
              fontSize: 13,
            }}>
              <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{r.name}</p>
              <span style={{ color: "var(--color-text-secondary)" }}>{r.description || "—"}</span>
              <StatusBadge active={r.isActive} />
              <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                {new Date(r.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                {new Date(r.updatedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                {/* view only — delete/restore not implemented yet */}
                <IconBtn title={`عرض ${r.name}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(r)}>
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