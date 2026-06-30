"use client";

import { Role } from "@/src/types/role";
import { Spinner } from "../UI";


// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      borderRadius: "var(--radius-full)",
      border: active ? "1px solid #BBF7D0" : "1px solid #FECACA",
      background: active ? "#DCFCE7" : "#FEF2F2",
      padding: "0.2rem 0.625rem",
      fontSize: 11, fontWeight: 600,
      color: active ? "#166534" : "#991B1B",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "نشط" : "معطل"}
    </span>
  );
}

// ── Icon button ───────────────────────────────────────────────────────────────
function IconBtn({ onClick, title, color, bg, borderColor, children }: {
  onClick: () => void; title: string; color: string; bg: string; borderColor: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} aria-label={title}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        width: 32, height: 32, borderRadius: "var(--radius-md)",
        border: `1px solid ${borderColor}`, background: bg, color,
        cursor: "pointer", display: "inline-flex", alignItems: "center",
        justifyContent: "center", transition: "opacity 150ms",
      }}>
      {children}
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface RoleTableProps {
  roles:        Role[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onEdit:       (role: Role) => void;
  onDelete:     (role: Role) => void;
  onView:       (role: Role) => void;
  onAddFirst:   () => void;
  onPageChange: (p: number) => void;
}

// ── Main table ────────────────────────────────────────────────────────────────
export function RoleTable({
  roles, loading, search, page, pages,
  onEdit, onDelete, onView, onAddFirst, onPageChange,
}: RoleTableProps) {
  return (
    <div style={cardStyle}>
      {/* Column headers */}
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 1fr 120px", ...thStyle }}>
        <span>اسم الدور</span>
        <span>الوصف</span>
        <span>الصلاحيات</span>
        <span>الحالة</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : roles.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            {search ? `لا توجد نتائج لـ "${search}"` : "لا توجد أدوار لعرضها"}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
            {!search && "ابدأ بإنشاء أول دور في النظام"}
          </p>
          {!search && (
            <button type="button" onClick={onAddFirst}
              style={{ fontSize: 13, fontWeight: 600, color: "var(--color-brand-600)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              إضافة أول دور
            </button>
          )}
        </div>
      ) : (
        /* Data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {roles.map((role, i) => (
            <li key={role.id} style={{
              display: "grid", gridTemplateColumns: "2fr 3fr 1fr 1fr 120px",
              alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{role.name}</span>
              <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>
                {role.description || <span style={{ color: "var(--color-text-hint)", fontStyle: "italic" }}>لا يوجد وصف</span>}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: "var(--radius-full)",
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                fontSize: 11, fontWeight: 700, color: "#1D4ED8",
              }}>
                {role.permissions?.length ?? 0}
              </span>
              <StatusBadge active={role.isActive} />
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                {/* View */}
                <IconBtn title={`عرض ${role.name}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(role)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </IconBtn>
                {/* Edit */}
                <IconBtn title={`تعديل ${role.name}`} color="#1D4ED8" bg="#EFF6FF" borderColor="#BFDBFE" onClick={() => onEdit(role)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </IconBtn>
                {/* Delete */}
                <IconBtn title={`حذف ${role.name}`} color="#DC2626" bg="#FEF2F2" borderColor="#FECACA" onClick={() => onDelete(role)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
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
                style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", padding: "0.375rem 0.875rem", fontSize: 12, color: "var(--color-text-secondary)", cursor: btn.disabled ? "not-allowed" : "pointer", opacity: btn.disabled ? 0.4 : 1 }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}