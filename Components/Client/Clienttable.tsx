"use client";

import { Spinner } from "../UI";
import type { Client } from "../../types/client";

// ── Address count badge ────────────────────────────────────────────────────
function AddressBadge({ count }: { count: number }) {
  const hasAddr = count > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-full)",
        border: hasAddr ? "1px solid #BFDBFE" : "1px solid var(--color-border)",
        background: hasAddr ? "#EFF6FF" : "var(--color-surface-muted)",
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: hasAddr ? "#1D4ED8" : "var(--color-text-muted)",
      }}
    >
      {count} {count === 1 ? "عنوان" : "عناوين"}
    </span>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ active }: { active?: boolean }) {
  const isActive = active !== false;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: "var(--radius-full)",
        border: isActive ? "1px solid #BBF7D0" : "1px solid #FECACA",
        background: isActive ? "#DCFCE7" : "#FEF2F2",
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: isActive ? "#166534" : "#991B1B",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isActive ? "#16A34A" : "#DC2626",
        }}
      />
      {isActive ? "نشط" : "غير نشط"}
    </span>
  );
}

// ── Icon button (mirrors UserTable's IconBtn) ──────────────────────────────
function IconBtn({
  onClick,
  title,
  color,
  bg,
  borderColor,
  children,
}: {
  onClick: () => void;
  title: string;
  color: string;
  bg: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        width: 32,
        height: 32,
        borderRadius: "var(--radius-md)",
        border: `1px solid ${borderColor}`,
        background: bg,
        color,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 150ms",
      }}
    >
      {children}
    </button>
  );
}

// ── Shared card & header styles ────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  overflow: "hidden",
  boxShadow: "var(--shadow-card)",
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "var(--color-text-muted)",
  background: "var(--color-surface-muted)",
  borderBottom: "1px solid var(--color-border)",
};

// ── Props ──────────────────────────────────────────────────────────────────
interface ClientTableProps {
  clients:      Client[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onEdit:       (client: Client) => void;
  onDelete:     (client: Client) => void;
  onAddFirst:   () => void;
  onPageChange: (p: number) => void;
  /** Navigate to address management for a client */
  onManageAddresses: (client: Client) => void;
}

// ── Main table ─────────────────────────────────────────────────────────────
export function ClientTable({
  clients,
  loading,
  search,
  page,
  pages,
  onEdit,
  onDelete,
  onAddFirst,
  onPageChange,
  onManageAddresses,
}: ClientTableProps) {
  return (
    <div style={cardStyle}>
      {/* Column headers */}
      <div
        dir="rtl"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 80px",
          ...thStyle,
        }}
      >
        <span>العميل</span>
        <span>البريد الإلكتروني</span>
        <span>الهاتف</span>
        <span>العناوين</span>
        <span style={{ textAlign: "center" }}>تاريخ الإضافة</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {/* Loading */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "4rem 0",
            color: "var(--color-text-muted)",
          }}
        >
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : clients.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {search
              ? `لا توجد نتائج لـ "${search}"`
              : "لا يوجد عملاء لعرضهم."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={onAddFirst}
              style={{
                marginTop: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-brand-600)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              أضف أول عميل
            </button>
          )}
        </div>
      ) : (
        /* Data rows */
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {clients.map((c, i) => (
            <li
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 80px",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                background:
                  i % 2 !== 0
                    ? "var(--color-surface-muted)"
                    : "transparent",
                fontSize: 13,
                cursor: "pointer",
              }}
              onClick={() => onManageAddresses(c)}
              title={`إدارة عناوين ${c.name}`}
            >
              {/* Name */}
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  {c.name}
                </p>
                {c.taxId && (
                  <p
                    style={{
                      marginTop: 2,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {c.taxId}
                  </p>
                )}
              </div>

              {/* Email */}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "#2563EB",
                  fontWeight: 600,
                }}
              >
                {c.email}
              </span>

              {/* Phone */}
              <span style={{ color: "var(--color-text-secondary)" }}>
                {c.phone}
              </span>

              {/* Address count */}
              <AddressBadge count={c.addresses?.length ?? 0} />

              {/* Created at */}
              <span
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "var(--color-text-muted)",
                }}
              >
                {new Date(c.createdAt).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                }}
                onClick={(e) => e.stopPropagation()} // prevent row navigation
              >
                <IconBtn
                  title={`تعديل ${c.name}`}
                  color="#1D4ED8"
                  bg="#EFF6FF"
                  borderColor="#BFDBFE"
                  onClick={() => onEdit(c)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </IconBtn>
                <IconBtn
                  title={`حذف ${c.name}`}
                  color="#DC2626"
                  bg="#FEF2F2"
                  borderColor="#FECACA"
                  onClick={() => onDelete(c)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
        <div
          dir="rtl"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--color-border)",
            padding: "0.875rem 1.5rem",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            صفحة{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong>{" "}
            من{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              {
                label: "السابق",
                action: () => onPageChange(Math.max(1, page - 1)),
                disabled: page === 1,
              },
              {
                label: "التالي",
                action: () => onPageChange(Math.min(pages, page + 1)),
                disabled: page === pages,
              },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                disabled={btn.disabled}
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-muted)",
                  padding: "0.375rem 0.875rem",
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  cursor: btn.disabled ? "not-allowed" : "pointer",
                  opacity: btn.disabled ? 0.4 : 1,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}