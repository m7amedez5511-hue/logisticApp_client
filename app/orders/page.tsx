"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { get } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";

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
 data:{
   data: Order[];
  pagination: { total: number; page: number; pages: number };
 }
}

const STATUS_MAP: Record<Order["currentStatus"], { label: string; color: string; bg: string; border: string }> = {
  Created:   { label: "تم الإنشاء",  color: "#93C5FD", bg: "rgba(59,130,246,0.10)",  border: "rgba(147,197,253,0.20)" },
  Assigned:  { label: "مُعيَّن",      color: "#C4B5FD", bg: "rgba(139,92,246,0.10)", border: "rgba(196,181,253,0.20)" },
  InTransit: { label: "قيد التوصيل", color: "#FDE68A", bg: "rgba(251,191,36,0.10)",  border: "rgba(253,230,138,0.20)" },
  Delivered: { label: "تم التسليم",  color: "#A7F3D0", bg: "rgba(52,211,153,0.10)",  border: "rgba(167,243,208,0.20)" },
  Returned:  { label: "مُرتجع",      color: "#FCA5A5", bg: "rgba(244,63,94,0.08)",   border: "rgba(252,165,165,0.20)" },
  Cancelled: { label: "ملغي",        color: "#94A3B8", bg: "rgba(255,255,255,0.04)", border: "var(--color-border-dark)" },
};

const PAY_MAP: Record<string, { label: string; color: string }> = {
  Pending:  { label: "معلَّق",   color: "#FBBF24" },
  Paid:     { label: "مدفوع",   color: "#34D399" },
  Failed:   { label: "فشل",     color: "#F87171" },
  Refunded: { label: "مُسترجع", color: "#94A3B8" },
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
        setOrders(res.data.data);
        setTotal(res.data.pagination.total);
        setPages(res.data.pagination.pages);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  const cardStyle: React.CSSProperties = {
    borderRadius: "var(--radius-2xl)",
    border: "1px solid var(--color-border-dark)",
    background: "var(--color-surface-dark-card)",
    overflow: "hidden",
    boxShadow: "var(--shadow-card)",
  };

  const thStyle: React.CSSProperties = {
    padding: "0.75rem 1.5rem",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.25em",
    color: "var(--color-text-dark-muted)",
    background: "rgba(255,255,255,0.04)",
    borderBottom: "1px solid var(--color-border-dark)",
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <header style={{
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-border-dark)",
        background: "rgba(255,255,255,0.04)",
        padding: "1.5rem 2rem",
        boxShadow: "var(--shadow-overlay)",
        backdropFilter: "blur(16px)",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "#67E8F9" }}>
          إدارة الشحنات
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0 }}>الطلبات</h1>
            <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-dark-muted)" }}>
              إجمالي <strong style={{ color: "var(--color-text-dark-primary)" }}>{total}</strong> طلب
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              dir="rtl"
              style={{ height: 40, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", fontSize: 13, color: "var(--color-text-dark-muted)", padding: "0 0.75rem", outline: "none", fontFamily: "var(--font-sans)" }}
            >
              <option value="">كل الحالات</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {/* Search */}
            <div style={{ position: "relative", width: 256 }}>
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-dark-muted)", pointerEvents: "none" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="رقم الشحنة أو المستلم..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} dir="rtl"
                style={{ width: "100%", height: 40, paddingRight: 36, paddingLeft: 12, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", fontSize: 13, color: "var(--color-text-dark-primary)", outline: "none", fontFamily: "var(--font-sans)" }}
              />
            </div>
          </div>
        </div>
      </header>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} className="border-rose-400/30 bg-rose-500/10 text-rose-200" />}

      {/* ── Table ── */}
      <div style={cardStyle}>
        <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "1.8fr 1.5fr 1.2fr 1fr 1fr 1fr", ...thStyle }}>
          <span>رقم الشحنة</span><span>المستلم</span><span>العميل</span>
          <span>المبلغ</span><span>الحالة</span>
          <span style={{ textAlign: "center" }}>التاريخ</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-dark-muted)" }}>
            <Spinner size="sm" className="text-cyan-400" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", fontSize: 13, color: "var(--color-text-dark-muted)" }}>لا توجد نتائج</p>
        ) : (
          <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {orders.map((o, i) => {
              const status = STATUS_MAP[o.currentStatus];
              const pay    = o.paymentStatus ? PAY_MAP[o.paymentStatus] : null;
              return (
                <li key={o.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1.5fr 1.2fr 1fr 1fr 1fr", alignItems: "center", gap: "0.5rem", padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border-dark)", background: i % 2 !== 0 ? "rgba(255,255,255,0.02)" : "transparent", transition: "var(--transition-base)", fontSize: 13 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#67E8F9", margin: 0 }}>{o.shipmentNumber}</p>
                    {o.trip && <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-dark-muted)" }}>رحلة: {o.trip.tripNumber}</p>}
                  </div>
                  <div>
                    <p style={{ color: "var(--color-text-dark-primary)", margin: 0 }}>{o.recipientName}</p>
                    <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-dark-muted)" }}>{o.recipientPhone}</p>
                  </div>
                  <span style={{ color: "var(--color-text-dark-muted)" }}>{o.client?.name ?? "—"}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0 }}>
                      {o.totalPrice != null ? `${o.totalPrice.toFixed(2)} ر.س` : "—"}
                    </p>
                    {pay && <p style={{ marginTop: 2, fontSize: 11, fontWeight: 600, color: pay.color }}>{pay.label}</p>}
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-full)", border: `1px solid ${status.border}`, background: status.bg, padding: "0.2rem 0.625rem", fontSize: 11, fontWeight: 600, color: status.color, width: "fit-content" }}>
                    {status.label}
                  </span>
                  <span style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-dark-muted)" }}>
                    {new Date(o.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border-dark)", padding: "1rem 1.5rem" }}>
            <span style={{ fontSize: 12, color: "var(--color-text-dark-muted)" }}>
              صفحة <strong style={{ color: "var(--color-text-dark-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-dark-primary)" }}>{pages}</strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[{ label: "السابق", action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
                { label: "التالي",  action: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages }].map(btn => (
                <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                  style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.375rem 0.75rem", fontSize: 12, color: "var(--color-text-dark-muted)", cursor: btn.disabled ? "not-allowed" : "pointer", opacity: btn.disabled ? 0.4 : 1, transition: "var(--transition-base)", fontFamily: "var(--font-sans)" }}>
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