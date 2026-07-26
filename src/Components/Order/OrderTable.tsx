"use client";

import { Spinner } from "../UI";
import type { Order } from "@/src/types/order";
import { ORDER_STATUS_MAP } from "./OrderDetailModel";

// ── Helpers — copied verbatim from app/dashboard/drivers/page.tsx ───────

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtAmount(n?: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(2)} ر.س`;
}

// ── Styles — identical tokens/values to the Drivers page, per the
//    "no new styles" constraint; only column widths differ to fit Order's
//    field set (shipment / recipient / client / amount / status / actions).

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

// Shared across header + rows — keep these in sync or columns will misalign.
const ROW_GRID_COLUMNS = "1.6fr 1.6fr 1.2fr 1.1fr 1fr 0.8fr";

const iconBtnBase: React.CSSProperties = {
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  flexShrink: 0,
};

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  search: string;
  page: number;
  pages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onRowClick: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

export function OrderTable({
  orders,
  loading,
  search,
  page,
  pages,
  setPage,
  onRowClick,
  onEdit,
  onDelete,
}: OrderTableProps) {
  return (
    <div style={cardStyle}>
      <div
        dir="rtl"
        style={{
          display: "grid",
          gridTemplateColumns: ROW_GRID_COLUMNS,
          ...thStyle,
        }}
      >
        <span>رقم الشحنة</span>
        <span>المستلم</span>
        <span>العميل</span>
        <span>المبلغ</span>
        <span>الحالة</span>
        <span>إجراءات</span>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : orders.length === 0 ? (
        <p style={{ textAlign: "center", padding: "4rem 0", fontSize: 13, color: "var(--color-text-muted)" }}>
          لا توجد نتائج {search && `لـ "${search}"`}
        </p>
      ) : (
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {orders.map((o, i) => {
            const statusCfg = ORDER_STATUS_MAP[o.currentStatus] ?? ORDER_STATUS_MAP.Created;

            return (
              <li
                key={o.id}
                onClick={() => onRowClick(o.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: ROW_GRID_COLUMNS,
                  alignItems: "center", gap: "0.5rem",
                  padding: "0.875rem 1.5rem",
                  borderBottom: "1px solid var(--color-border)",
                  background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover, #F8FAFC)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent")}
              >
                <div>
                  <p style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "#2563EB", margin: 0 }}>{o.shipmentNumber}</p>
                  <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>{fmtDate(o.createdAt)}</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{o.recipientName}</p>
                  <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{o.recipientPhone}</p>
                </div>
                <span style={{ color: "var(--color-text-secondary)" }}>{o.client?.name ?? "—"}</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                  {fmtAmount(o.totalPrice)}
                </span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${statusCfg.border}`,
                  background: statusCfg.bg,
                  padding: "0.2rem 0.625rem",
                  fontSize: 11, fontWeight: 600, color: statusCfg.color,
                  width: "fit-content",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfg.dot, flexShrink: 0 }} />
                  {statusCfg.label}
                </span>

                {/* ── Inline row actions: edit / delete ──
                     stopPropagation is required on both buttons so the
                     click doesn't bubble up to the <li> onClick and
                     open the detail panel as well. */}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    aria-label="تعديل الطلب"
                    title="تعديل"
                    onClick={(e) => { e.stopPropagation(); onEdit(o); }}
                    style={{
                      ...iconBtnBase,
                      border: "1px solid var(--color-brand-200)",
                      background: "var(--color-brand-50, #EFF6FF)",
                      color: "var(--color-brand-600)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    aria-label="حذف الطلب"
                    title="حذف"
                    onClick={(e) => { e.stopPropagation(); onDelete(o); }}
                    style={{
                      ...iconBtnBase,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      color: "#DC2626",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div
          dir="rtl"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.5rem",
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
              { label: "السابق", action: () => setPage(p => Math.max(1, p - 1)),     disabled: page === 1     },
              { label: "التالي", action: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                disabled={btn.disabled}
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-muted)",
                  padding: "0.375rem 0.875rem",
                  fontSize: 12, color: "var(--color-text-secondary)",
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