"use client";

import { useEffect } from "react";
import { Spinner } from "../../UI";
import { useArchivedClient } from "@/src/hooks/archive/useArchiveClient";

interface ArchivedClientDetailModalProps {
  clientId: string;
  onClose:  () => void;
}

// ── small helper components ───────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "0.75rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: value ? "var(--color-text-primary)" : "var(--color-text-hint)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      borderRadius: "var(--radius-full)",
      border: active ? "1px solid #BBF7D0" : "1px solid #FECACA",
      background: active ? "#DCFCE7" : "#FEF2F2",
      padding: "0.25rem 0.75rem",
      fontSize: 12, fontWeight: 600,
      color: active ? "#166534" : "#991B1B",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "نشط" : "معطل"}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #EA580C 0%, #B91C1C 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 700, color: "#FFF",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(234,88,12,.3)",
    }}>
      {initials}
    </div>
  );
}

// Small badge for an archived order row's status
function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: "uppercase",
      borderRadius: "var(--radius-full)",
      border: "1px solid var(--color-border)",
      background: "var(--color-surface-muted)",
      color: "var(--color-text-muted)",
      padding: "0.15rem 0.5rem",
    }}>
      {status}
    </span>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function ArchivedClientDetailModal({ clientId, onClose }: ArchivedClientDetailModalProps) {
  const {
    client, loading, error,
    orders, ordersLoading, ordersError,
    ordersPage, ordersPages, ordersTotal,
    setOrdersPage,
  } = useArchivedClient(clientId);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="archived-client-detail-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 55,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* ── header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#EA580C", fontWeight: 600, margin: 0 }}>
              عميل مؤرشف
            </p>
            <h2 id="archived-client-detail-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {client?.name ?? "عرض العميل"}
            </h2>
          </div>
          <button
            type="button" onClick={onClose} aria-label="إغلاق"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              cursor: "pointer", fontSize: 18,
              color: "var(--color-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* ── body ── */}
        <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "75vh" }}>

          {/* loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          )}

          {/* error */}
          {!loading && error && (
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              background: "#FEF2F2", border: "1px solid #FECACA",
              fontSize: 13, color: "#991B1B", fontWeight: 500,
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* content */}
          {!loading && client && (
            <div dir="rtl">
              {/* avatar + name + status row */}
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "0 0 1.25rem",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "0.25rem",
              }}>
                <Avatar name={client.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{client.name}</p>
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge active={client.isActive} />
                  </div>
                </div>
              </div>

              {/* detail rows */}
              <DetailRow label="البريد الإلكتروني" value={client.email} />
              <DetailRow label="رقم الهاتف"       value={client.phone} />
              <DetailRow label="الرقم الضريبي"     value={client.taxId} />
              <DetailRow label="ملاحظات"           value={client.notes} />
              <DetailRow label="تاريخ الإنشاء"     value={fmt(client.createdAt)} />
              <DetailRow label="آخر تحديث"         value={fmt(client.updatedAt)} />
              {client.deletedAt && (
                <DetailRow label="تاريخ الحذف" value={fmt(client.deletedAt)} />
              )}

              {/* ── addresses ── */}
              <p style={{ marginTop: "1.5rem", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                العناوين ({client.addresses?.length ?? 0})
              </p>
              {!client.addresses || client.addresses.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-hint)", padding: "0.75rem 0" }}>
                  لا توجد عناوين مرتبطة بهذا العميل.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
                  {client.addresses.map(addr => (
                    <div key={addr.id} style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.625rem 0.875rem",
                      fontSize: 12, color: "var(--color-text-secondary)",
                    }}>
                      <strong style={{ color: "var(--color-text-primary)" }}>{addr.label}</strong>
                      {" — "}{addr.street}، {addr.city}
                    </div>
                  ))}
                </div>
              )}

              {/* ── archived orders ── */}
              <p style={{ marginTop: "1.5rem", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                الطلبات المؤرشفة ({ordersTotal})
              </p>

              {ordersLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "1rem 0", color: "var(--color-text-muted)" }}>
                  <Spinner size="sm" className="text-blue-600" />
                  <span style={{ fontSize: 12 }}>جارٍ تحميل الطلبات…</span>
                </div>
              ) : ordersError ? (
                <div style={{ fontSize: 12, color: "#991B1B", padding: "0.5rem 0" }}>{ordersError}</div>
              ) : orders.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-hint)", padding: "0.75rem 0" }}>
                  لا توجد طلبات مؤرشفة لهذا العميل.
                </p>
              ) : (
                <>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6, paddingTop: 8 }}>
                    {orders.map(o => (
                      <li key={o.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.5rem 0.875rem",
                        fontSize: 12,
                      }}>
                        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {o.orderNumber ?? o.id}
                        </span>
                        <OrderStatusBadge status={o.status} />
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {new Date(o.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {ordersPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10 }}>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                        صفحة {ordersPage} من {ordersPages}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" disabled={ordersPage === 1}
                          onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                          style={{ fontSize: 11, padding: "0.25rem 0.625rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", cursor: ordersPage === 1 ? "not-allowed" : "pointer", opacity: ordersPage === 1 ? 0.4 : 1 }}>
                          السابق
                        </button>
                        <button type="button" disabled={ordersPage === ordersPages}
                          onClick={() => setOrdersPage(Math.min(ordersPages, ordersPage + 1))}
                          style={{ fontSize: 11, padding: "0.25rem 0.625rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", cursor: ordersPage === ordersPages ? "not-allowed" : "pointer", opacity: ordersPage === ordersPages ? 0.4 : 1 }}>
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            type="button" onClick={onClose}
            style={{
              height: 40, padding: "0 1.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13, fontWeight: 600,
              color: "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}