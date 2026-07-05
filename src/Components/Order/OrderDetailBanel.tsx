"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner, Alert } from "../UI";
import { orderService } from "@/src/services/order.service";
import type { Order, OrderStatus, UpdateOrderStatusPayload } from "@/src/types/order";

// ── Status config ────────────────────────────────────────────────────────
// Same shape as DRIVER_STATUS_MAP in src/types/driver.ts, kept local here
// since order.ts doesn't currently export a colour map of its own.
const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  Created:   { label: "تم الإنشاء",  color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  Assigned:  { label: "مُعيَّن",      color: "#5B21B6", bg: "#F5F3FF", border: "#DDD6FE", dot: "#8B5CF6" },
  InTransit: { label: "قيد التوصيل", color: "#854D0E", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  Delivered: { label: "تم التسليم",  color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", dot: "#16A34A" },
  Returned:  { label: "مُرتجع",      color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", dot: "#DC2626" },
  Cancelled: { label: "ملغي",        color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0", dot: "#94A3B8" },
};

const PAY_STATUS_MAP: Record<string, { label: string; color: string }> = {
  Pending:  { label: "معلَّق",   color: "#D97706" },
  Paid:     { label: "مدفوع",   color: "#16A34A" },
  Failed:   { label: "فشل",     color: "#DC2626" },
  Refunded: { label: "مُسترجع", color: "#64748B" },
};

const PAY_METHOD_LABEL: Record<string, string> = {
  Cash: "نقداً",
  Card: "بطاقة",
  Prepaid: "مدفوع مسبقاً",
};

// ── Helpers — identical to DriverDetailPanel.tsx's fmtDate ──────────────
function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtAmount(n?: number | string | null): string {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (isNaN(num)) return "—";
  return `${num.toFixed(2)} ر.س`;
}

// ── Sub-components — copied verbatim from DriverDetailPanel.tsx ─────────
// (DetailRow / SectionHeading carry no Driver-specific logic, so they are
// reproduced here rather than imported, matching how the Driver files keep
// their detail-panel building blocks local to the panel that uses them.)

function DetailRow({
  label,
  value,
  mono = false,
  warn = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "0.55rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          color: warn ? "#D97706" : "var(--color-text-primary)",
          fontWeight: warn ? 600 : 400,
          maxWidth: "60%",
          textAlign: "left",
          wordBreak: "break-word",
        }}
      >
        {warn && value !== "—" ? "⚠ " : ""}
        {value}
      </span>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "var(--color-text-hint)",
        fontWeight: 700,
        margin: "1.25rem 0 0.5rem",
      }}
    >
      {title}
    </p>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────

interface OrderDetailPanelProps {
  orderId: string;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  /** Bubble a status change up so the list row updates without a full reload */
  onStatusChanged?: (order: Order) => void;
}

// ── Component ─────────────────────────────────────────────────────────────
// Structurally identical to DriverDetailPanel.tsx: fixed backdrop + slide-in
// <aside>, header with avatar-equivalent badge, scrollable body of
// SectionHeading/DetailRow blocks, sticky footer actions.

export function OrderDetailPanel({
  orderId,
  onClose,
  onEdit,
  onDelete,
  onStatusChanged,
}: OrderDetailPanelProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline status-update control state
  const [statusDraft, setStatusDraft] = useState<OrderStatus | "">("");
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getById(orderId);
      const data = (res as unknown as { data: Order }).data ?? (res as unknown as Order);
      setOrder(data);
      setStatusDraft(data.currentStatus);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل بيانات الطلب.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { queueMicrotask(loadOrder); }, [loadOrder]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Status update — alert shown inline in the panel, success bubbled up ──
  const handleStatusUpdate = useCallback(async () => {
    if (!order || !statusDraft || statusDraft === order.currentStatus) return;
    setUpdatingStatus(true);
    setStatusError(null);
    try {
      const payload: UpdateOrderStatusPayload = { status: statusDraft };
      if (statusReason) payload.reason = statusReason;
      const res = await orderService.updateStatus(order.id, payload);
      const updated = (res as unknown as { data: Order }).data ?? (res as unknown as Order);
      setOrder(updated);
      setStatusReason("");
      onStatusChanged?.(updated);
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : "تعذّر تحديث حالة الطلب.");
    } finally {
      setUpdatingStatus(false);
    }
  }, [order, statusDraft, statusReason, onStatusChanged]);

  const statusConfig = order ? ORDER_STATUS_MAP[order.currentStatus] : null;
  const payStatus = order?.paymentStatus ? PAY_STATUS_MAP[order.paymentStatus] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Slide-in panel */}
      <aside
        aria-label="تفاصيل الطلب"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(520px, 100vw)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "8px 0 40px rgba(0,0,0,.18)",
          overflowY: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Shipment "avatar" badge — order has no photo, so a glyph stands in for it,
                  matching the circular-badge slot Driver uses for its avatar image. */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: "2px solid var(--color-brand-200)",
                  background: "var(--color-surface-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-600)" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
              </div>

              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
                  ملف الطلب
                </p>
                {order && (
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>
                    {order.shipmentNumber}
                  </h2>
                )}
                {order?.trip?.tripNumber && (
                  <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                    رحلة: {order.trip.tripNumber}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                cursor: "pointer",
                fontSize: 18,
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2rem 0" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>جارٍ التحميل…</span>
            </div>
          )}

          {error && (
            <div style={{
              borderRadius: "var(--radius-md)",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              padding: "0.75rem 1rem",
              fontSize: 13,
              color: "#DC2626",
            }}>
              ⚠ {error}
            </div>
          )}

          {order && !loading && (
            <>
              {/* Status badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
                {statusConfig && (
                  <span style={{
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${statusConfig.border}`,
                    background: statusConfig.bg,
                    padding: "0.3rem 0.875rem",
                    fontSize: 12,
                    fontWeight: 700,
                    color: statusConfig.color,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusConfig.dot }} />
                    {statusConfig.label}
                  </span>
                )}
                {payStatus && (
                  <span style={{
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-muted)",
                    padding: "0.3rem 0.875rem",
                    fontSize: 12,
                    fontWeight: 700,
                    color: payStatus.color,
                  }}>
                    {payStatus.label}
                  </span>
                )}
              </div>

              <SectionHeading title="بيانات المستلم" />
              <DetailRow label="اسم المستلم" value={order.recipientName} />
              <DetailRow label="رقم الجوال"  value={order.recipientPhone} mono />
              <DetailRow label="العميل"      value={order.client?.name ?? "—"} />

              <SectionHeading title="بيانات الشحنة" />
              <DetailRow label="رقم الشحنة" value={order.shipmentNumber} mono />
              <DetailRow label="نوع الشحنة" value={order.type ?? "—"} />
              <DetailRow label="الكمية"      value={String(order.quantity ?? "—")} />
              <DetailRow label="الوزن"       value={order.weight != null ? `${order.weight} كجم` : "—"} />
              <DetailRow label="الرحلة"      value={order.trip?.tripNumber ?? "—"} mono />

              <SectionHeading title="بيانات الدفع" />
              <DetailRow label="طريقة الدفع" value={order.paymentMethod ? PAY_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod : "—"} />
              <DetailRow label="حالة الدفع"   value={payStatus?.label ?? "—"} />
              <DetailRow label="الإجمالي الفرعي" value={fmtAmount(order.subTotal)} mono />
              <DetailRow label="ضريبة القيمة المضافة" value={fmtAmount(order.vatAmount)} mono />
              <DetailRow label="الإجمالي" value={fmtAmount(order.totalPrice)} mono />

              {/* ── Delivery Address ── */}
              {order.deliveryAddress?.details && Object.values(order.deliveryAddress.details).some(Boolean) && (
                <>
                  <SectionHeading title="عنوان التسليم" />
                  {order.deliveryAddress.details.city      && <DetailRow label="المدينة"       value={order.deliveryAddress.details.city} />}
                  {order.deliveryAddress.details.district  && <DetailRow label="الحي"          value={order.deliveryAddress.details.district} />}
                  {order.deliveryAddress.details.street    && <DetailRow label="الشارع"        value={order.deliveryAddress.details.street} />}
                  {order.deliveryAddress.details.buildingNo && <DetailRow label="رقم المبنى"   value={order.deliveryAddress.details.buildingNo} mono />}
                  {order.deliveryAddress.details.unitNo    && <DetailRow label="رقم الوحدة"   value={order.deliveryAddress.details.unitNo} mono />}
                  {order.deliveryAddress.details.zipCode   && <DetailRow label="الرمز البريدي" value={order.deliveryAddress.details.zipCode} mono />}
                </>
              )}
              {!order.deliveryAddress?.details && order.deliveryAddressId && (
                <>
                  <SectionHeading title="عنوان التسليم" />
                  <DetailRow label="معرّف العنوان" value={order.deliveryAddressId} mono />
                </>
              )}

              {/* ── Pickup Address ── */}
              {order.pickupAddress?.details && Object.values(order.pickupAddress.details).some(Boolean) && (
                <>
                  <SectionHeading title="عنوان الاستلام" />
                  {order.pickupAddress.details.city       && <DetailRow label="المدينة"       value={order.pickupAddress.details.city} />}
                  {order.pickupAddress.details.district   && <DetailRow label="الحي"          value={order.pickupAddress.details.district} />}
                  {order.pickupAddress.details.street     && <DetailRow label="الشارع"        value={order.pickupAddress.details.street} />}
                  {order.pickupAddress.details.buildingNo && <DetailRow label="رقم المبنى"   value={order.pickupAddress.details.buildingNo} mono />}
                  {order.pickupAddress.details.unitNo     && <DetailRow label="رقم الوحدة"   value={order.pickupAddress.details.unitNo} mono />}
                  {order.pickupAddress.details.zipCode    && <DetailRow label="الرمز البريدي" value={order.pickupAddress.details.zipCode} mono />}
                </>
              )}
              {!order.pickupAddress?.details && order.pickupAddressId && (
                <>
                  <SectionHeading title="عنوان الاستلام" />
                  <DetailRow label="معرّف العنوان" value={order.pickupAddressId} mono />
                </>
              )}

              <SectionHeading title="معلومات النظام" />              <DetailRow label="تاريخ الإنشاء" value={fmtDate(order.createdAt)} />
              <DetailRow label="آخر تحديث"     value={fmtDate(order.updatedAt)} />

              {/* ── Inline status update ──
                   Same alert/feedback pattern as the rest of the panel: a
                   local Alert renders any failure, success simply updates
                   the badge above (no extra toast — the parent page's
                   global toast already fires via onStatusChanged). */}
              <SectionHeading title="تحديث الحالة" />
              {statusError && (
                <Alert type="error" message={statusError} onClose={() => setStatusError(null)} />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
                  dir="rtl"
                  style={{
                    height: 40, padding: "0 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13, color: "var(--color-text-primary)",
                    fontFamily: "var(--font-sans)", cursor: "pointer",
                  }}
                >
                  {Object.entries(ORDER_STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="سبب التغيير (اختياري)"
                  dir="rtl"
                  style={{
                    height: 40, padding: "0 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13, color: "var(--color-text-primary)",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || !statusDraft || statusDraft === order.currentStatus}
                  style={{
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: updatingStatus ? "var(--color-brand-400)" : "var(--color-brand-600)",
                    fontSize: 13, fontWeight: 700, color: "#FFF",
                    cursor: (updatingStatus || !statusDraft || statusDraft === order.currentStatus) ? "not-allowed" : "pointer",
                    opacity: (!statusDraft || statusDraft === order.currentStatus) ? 0.6 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {updatingStatus && <Spinner size="sm" className="text-white" />}
                  {updatingStatus ? "جارٍ التحديث…" : "تحديث الحالة"}
                </button>
              </div>

              {order.statusHistory && order.statusHistory.length > 0 && (
                <>
                  <SectionHeading title="سجل الحالات" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {order.statusHistory.slice(0, 5).map((h) => {
                      const s = ORDER_STATUS_MAP[h.status] ?? ORDER_STATUS_MAP.Created;
                      return (
                        <div
                          key={h.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${s.border}`,
                            background: s.bg,
                            padding: "0.5rem 0.875rem",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                            {h.reason && (
                              <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginRight: 8 }}>
                                — {h.reason}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                            {fmtDate(h.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer actions ── */}
        {order && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-surface-muted)",
              display: "flex",
              gap: "0.75rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => onDelete(order)}
              style={{
                height: 40, padding: "0 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                fontSize: 13, fontWeight: 700, color: "#DC2626",
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              حذف
            </button>

            <button
              type="button"
              onClick={() => onEdit(order)}
              style={{
                height: 40, padding: "0 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-brand-200)",
                background: "var(--color-brand-50, #EFF6FF)",
                fontSize: 13, fontWeight: 700, color: "var(--color-brand-600)",
                cursor: "pointer", fontFamily: "var(--font-sans)",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              تعديل
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, height: 40,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)",
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              إغلاق
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export { ORDER_STATUS_MAP, PAY_STATUS_MAP, PAY_METHOD_LABEL };