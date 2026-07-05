"use client";

import { Spinner } from "../../UI";
import type { ArchivedClientAddress } from "@/src/types/client_adresses";

// ── validation badge ─────────────────────────────────────────────────────────
function ValidatedBadge({ validated }: { validated: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-full)", border: validated ? "1px solid #BBF7D0" : "1px solid var(--color-border)", background: validated ? "#DCFCE7" : "var(--color-surface-muted)", padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: validated ? "#166534" : "var(--color-text-muted)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: validated ? "#16A34A" : "var(--color-text-hint)" }} />
      {validated ? "موثّق" : "غير موثّق"}
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

// ── Props ────────────────────────────────────────────────────────────────────
interface ArchivedClientAddressesTableProps {
  addresses: ArchivedClientAddress[];
  loading:   boolean;
  search:    string;
  onView:    (address: ArchivedClientAddress) => void;
}

// ── main table — no pagination footer: the endpoint returns the full set ─────
export function ArchivedClientAddressesTable({ addresses, loading, search, onView }: ArchivedClientAddressesTableProps) {
  return (
    <div style={cardStyle}>
      {/* column headers */}
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1.2fr 1fr 1fr 100px", ...thStyle }}>
        <span>النوع</span>
        <span>العنوان</span>
        <span>جهة الاتصال</span>
        <span>الحالة</span>
        <span style={{ textAlign: "center" }}>تاريخ الإنشاء</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/* loading state */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : addresses.length === 0 ? (
        /* empty state */
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {search ? `لا توجد نتائج لـ "${search}"` : "لا توجد عناوين في الأرشيف."}
          </p>
        </div>
      ) : (
        /* data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {addresses.map((a, i) => (
            <li key={a._id} style={{
              display: "grid", gridTemplateColumns: "1.5fr 2fr 1.2fr 1fr 1fr 100px",
              alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
              fontSize: 13,
            }}>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{a.label}</p>
                {a.branchName && (
                  <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>{a.branchName}</p>
                )}
              </div>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {a.details.street}، {a.details.city}
              </span>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                {a.contactPerson?.name ?? "—"}
              </span>
              <ValidatedBadge validated={!!a.isValidated} />
              <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                {new Date(a.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                {/* view only — matches archived users/clients: no delete/restore yet */}
                <IconBtn title={`عرض ${a.label}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(a)}>
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
    </div>
  );
}