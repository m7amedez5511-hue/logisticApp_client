"use client";

import { Spinner } from "../UI";
import type { User } from "../../types/user";

// ── role ────────────────────────────────────────────────────────────────
function RoleBadge({ name }: { name?: string }) {
  const isAdmin = name === "مدير النظام";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-full)", border: isAdmin ? "1px solid #BFDBFE" : "1px solid var(--color-border)", background: isAdmin ? "#EFF6FF" : "var(--color-surface-muted)", padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: isAdmin ? "#1D4ED8" : "var(--color-text-muted)" }}>
      {name ?? "—"}
    </span>
  );
}

// ──  status ───────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: active ? "1px solid #BBF7D0" : "1px solid #FECACA", background: active ? "#DCFCE7" : "#FEF2F2", padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: active ? "#166534" : "#991B1B" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "نشط" : "معطل"}
    </span>
  );
}

// icon buton  ───────────────────────────────────────────────────────────────
function IconBtn({ onClick, title, color, bg, borderColor, children }: { onClick: () => void; title: string; color: string; bg: string; borderColor: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", border: `1px solid ${borderColor}`, background: bg, color, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 150ms" }}>
      {children}
    </button>
  );
}

// ──   title style ───────────────────────────────────────────────────
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

// ── Props  ──────────────────────────────────────────────────────────────
interface UserTableProps {
  users:        User[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onEdit:       (user: User) => void;
  onDelete:     (user: User) => void;
  onAddFirst:   () => void;
  onPageChange: (p: number) => void;
}

// ──  main table ────────────────────────────────────────────────────────────
export function UserTable({ users, loading, search, page, pages, onEdit, onDelete, onAddFirst, onPageChange }: UserTableProps) {
  return (
    <div style={cardStyle}>
      {/*  column headers */}
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr 80px", ...thStyle }}>
        <span>الاسم</span>
        <span>اسم المستخدم</span>
        <span>الفرع</span>
        <span>الدور</span>
        <span>الحالة</span>
        <span style={{ textAlign: "center" }}>تاريخ الإنشاء</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/*  loading state */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : users.length === 0 ? (
        //  empty state 
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {search ? `لا توجد نتائج لـ "${search}"` : "لا يوجد مستخدمون لعرضهم."}
          </p>
          {!search && (
            <button type="button" onClick={onAddFirst}
              style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "var(--color-brand-600)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              أضف أول مستخدم
            </button>
          )}
        </div>
      ) : (
        //  data rows
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {users.map((u, i) => (
            <li key={u.id} style={{
              display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr 80px",
              alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
              fontSize: 13,
            }}>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{u.name}</p>
                <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{u.phone}</p>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>{u.userName ?? "—"}</span>
              <span style={{ color: "var(--color-text-secondary)" }}>{u.branch?.name ?? "—"}</span>
              <RoleBadge name={u.role?.name} />
              <StatusBadge active={u.isActive} />
              <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                {new Date(u.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                <IconBtn title={`تعديل ${u.name}`} color="#1D4ED8" bg="#EFF6FF" borderColor="#BFDBFE" onClick={() => onEdit(u)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </IconBtn>
                <IconBtn title={`حذف ${u.name}`} color="#DC2626" bg="#FEF2F2" borderColor="#FECACA" onClick={() => onDelete(u)}>
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

      {/*  pagination */}
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