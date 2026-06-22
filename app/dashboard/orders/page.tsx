"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { get } from "@/src/services/api";
import { Spinner, Alert } from "@/src/Components/UI";

interface Order {
  id: string;
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  currentStatus: "Created" | "Assigned" | "InTransit" | "Delivered" | "Returned" | "Cancelled";
  totalPrice?: number;
  paymentMethod?: string;
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
  client?: { name: string };
  trip?: { tripNumber: string };
  createdAt: string;
}

interface ApiResponse {
  data: {
    data: Order[];
    pagination: { total: number; page: number; pages: number };
    meta?: { total: number; pages: number };
  };
}

const STATUS_MAP: Record<Order["currentStatus"], { label: string; color: string; bg: string; border: string }> = {
  Created:   { label: "تم الإنشاء",  color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
  Assigned:  { label: "مُعيَّن",      color: "#5B21B6", bg: "#F5F3FF", border: "#DDD6FE" },
  InTransit: { label: "قيد التوصيل", color: "#854D0E", bg: "#FFFBEB", border: "#FDE68A" },
  Delivered: { label: "تم التسليم",  color: "#166534", bg: "#DCFCE7", border: "#BBF7D0" },
  Returned:  { label: "مُرتجع",      color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" },
  Cancelled: { label: "ملغي",        color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
};

const PAY_MAP: Record<string, { label: string; color: string }> = {
  Pending:  { label: "معلَّق",   color: "#D97706" },
  Paid:     { label: "مدفوع",   color: "#16A34A" },
  Failed:   { label: "فشل",     color: "#DC2626" },
  Refunded: { label: "مُسترجع", color: "#64748B" },
};

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

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search)       params.set("search", search);
    if (statusFilter) params.set("currentStatus", statusFilter);
    get<ApiResponse>(`orders?${params}`, token)
      .then((res) => {
        const payload = res.data ?? res;
        setOrders(payload.data ?? []);
        setTotal(payload.meta?.total ?? 0);
        setPages(payload.meta?.pages ?? 1);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <header style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        padding: "1.5rem 2rem",
        boxShadow: "var(--shadow-card)",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
          إدارة الشحنات
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              الطلبات
            </h1>
            <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
              إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> طلب
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              dir="rtl"
              style={{
                height: 40, borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, color: "var(--color-text-secondary)",
                padding: "0 0.75rem", outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              <option value="">كل الحالات</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {/* Search */}
            <div style={{ position: "relative", width: 256 }}>
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="رقم الشحنة أو المستلم..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} dir="rtl"
                style={{
                  width: "100%", height: 40, paddingRight: 36, paddingLeft: 12,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  fontSize: 13, color: "var(--color-text-primary)",
                  outline: "none", fontFamily: "var(--font-sans)",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Table */}
      <div style={cardStyle}>
        <div dir="rtl" style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.5fr 1.2fr 1fr 1fr 1fr",
          ...thStyle,
        }}>
          <span>رقم الشحنة</span>
          <span>المستلم</span>
          <span>العميل</span>
          <span>المبلغ</span>
          <span>الحالة</span>
          <span style={{ textAlign: "center" }}>التاريخ</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", fontSize: 13, color: "var(--color-text-muted)" }}>
            لا توجد نتائج
          </p>
        ) : (
          <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {orders.map((o, i) => {
              const status = STATUS_MAP[o.currentStatus];
              const pay    = o.paymentStatus ? PAY_MAP[o.paymentStatus] : null;
              return (
                <li key={o.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1.5fr 1.2fr 1fr 1fr 1fr",
                  alignItems: "center", gap: "0.5rem",
                  padding: "0.875rem 1.5rem",
                  borderBottom: "1px solid var(--color-border)",
                  background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                  fontSize: 13,
                }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#2563EB", margin: 0 }}>
                      {o.shipmentNumber}
                    </p>
                    {o.trip && (
                      <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>
                        رحلة: {o.trip.tripNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={{ color: "var(--color-text-primary)", margin: 0 }}>{o.recipientName}</p>
                    <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>
                      {o.recipientPhone}
                    </p>
                  </div>
                  <span style={{ color: "var(--color-text-secondary)" }}>{o.client?.name ?? "—"}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                      {o.totalPrice != null ? `${o.totalPrice.toFixed(2)} ر.س` : "—"}
                    </p>
                    {pay && (
                      <p style={{ marginTop: 2, fontSize: 11, fontWeight: 600, color: pay.color }}>
                        {pay.label}
                      </p>
                    )}
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${status.border}`,
                    background: status.bg,
                    padding: "0.2rem 0.625rem",
                    fontSize: 11, fontWeight: 600, color: status.color,
                    width: "fit-content",
                  }}>
                    {status.label}
                  </span>
                  <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)" }}>
                    {new Date(o.createdAt).toLocaleDateString("ar-SA", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <div dir="rtl" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.5rem",
          }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              صفحة <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { label: "السابق", action: () => setPage(p => Math.max(1, p - 1)),    disabled: page === 1     },
                { label: "التالي", action: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-muted)",
                    padding: "0.375rem 0.875rem",
                    fontSize: 12, color: "var(--color-text-secondary)",
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    opacity: btn.disabled ? 0.4 : 1,
                    fontFamily: "var(--font-sans)",
                  }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}