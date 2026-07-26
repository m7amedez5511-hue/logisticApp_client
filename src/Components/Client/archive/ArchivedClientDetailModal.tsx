"use client";

import { Alert, Badge, Button, Modal, Spinner } from "../../UI";
import { useArchivedClient } from "@/src/hooks/archive/useArchiveClient";

interface ArchivedClientDetailModalProps {
  clientId: string;
  onClose:  () => void;
}

// ── small helper components (no template exists for a plain label/value row) ──
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

// Avatar has no equivalent in the shared UI kit — kept custom.
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

// ── main component ────────────────────────────────────────────────────────────
export function ArchivedClientDetailModal({ clientId, onClose }: ArchivedClientDetailModalProps) {
  const {
    client, loading, error,
    orders, ordersLoading, ordersError,
    ordersPage, ordersPages, ordersTotal,
    setOrdersPage,
  } = useArchivedClient(clientId);

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      open
      title={client?.name ?? "عرض العميل"}
      subtitle="عميل مؤرشف"
      onClose={onClose}
      zIndex={60}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {/* loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      )}

      {/* error */}
      {!loading && error && <Alert type="error" message={error} />}

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
                <Badge label={client.isActive ? "نشط" : "معطل"} color={client.isActive ? "green" : "red"} />
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
                  {" — "}{addr.details?.street}، {addr.details?.city}، {addr.details?.state}، {addr.details?.country}
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
                    <Badge label={o.status} color="slate" />
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
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={ordersPage === 1}
                      onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                    >
                      السابق
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={ordersPage === ordersPages}
                      onClick={() => setOrdersPage(Math.min(ordersPages, ordersPage + 1))}
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}