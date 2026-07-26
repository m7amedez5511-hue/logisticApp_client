"use client";

import { Button, EmptyState, IconBtn, Spinner } from "../../UI";
import { ORDER_STATUS_MAP } from "../OrderDetailModel";
import type { ArchivedOrder } from "@/src/types/order";


function fmtAmount(n?: string | number | null): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} ر.س`;
}

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
const ROW_GRID = "1.6fr 1.6fr 1fr 1fr 100px";

interface ArchivedOrderTableProps {
  orders:       ArchivedOrder[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  onView:       (order: ArchivedOrder) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedOrderTable({ orders, loading, search, page, pages, onView, onPageChange }: ArchivedOrderTableProps) {
  return (
    <div style={cardStyle}>
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: ROW_GRID, ...thStyle }}>
        <span>رقم الشحنة</span>
        <span>المستلم</span>
        <span>المبلغ</span>
        <span>الحالة</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="🗄️"
          title={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد طلبات في الأرشيف."}
        />
      ) : (
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {orders.map((o, i) => {
            const s = ORDER_STATUS_MAP[o.currentStatus] ?? ORDER_STATUS_MAP.Created;
            return (
              <li key={o.id} style={{
                display: "grid", gridTemplateColumns: ROW_GRID,
                alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                fontSize: 13,
              }}>
                <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "#2563EB" }}>
                  {o.shipmentNumber}
                </span>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{o.recipientName}</p>
                  <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{o.recipientPhone}</p>
                </div>
                <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                  {fmtAmount(o.subTotal)}
                </span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`,
                  background: s.bg, padding: "0.2rem 0.625rem",
                  fontSize: 11, fontWeight: 600, color: s.color, width: "fit-content",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
                  {s.label}
                </span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <IconBtn title={`عرض ${o.shipmentNumber}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(o)}>
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