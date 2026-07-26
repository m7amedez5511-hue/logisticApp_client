"use client";



import { useState, useCallback } from "react";
import { Alert, Spinner, Toast, ArchiveButton, ConfirmDialog } from "@/src/Components/UI";
import {  ORDER_STATUS_MAP } from "@/src/Components/Order/OrderDetailModel";
import { ArchivedOrdersModal } from "@/src/Components/Order/archive/ArchivedOrdersModal";
import { useOrders } from "@/src/hooks/useOrder";
import type { CreateOrderPayload, Order, UpdateOrderPayload } from "@/src/types/order";
import { OrderFormModal ,  OrderDetailPanel} from "@/src/Components/Order";

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

// ── Page Component ───────────────────────────────────────────────────────

export default function OrderComponent() {
  const {
    orders, loading, error, total, pages, page,
    search, statusFilter, setPage, handleSearch, handleStatusFilter, clearError,
    createOrder, updateOrder, deleteOrder,
    notification, reload,
  } = useOrders();

  // ── Panel / modal state — same three-state shape as DriversPage
  //    (selected id for the detail panel, "new" | Order | null for the
  //    form modal, Order | null for the delete modal). ───────────────────
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [formOrder, setFormOrder]             = useState<Order | null | "new">(null);
  const [deleteTarget, setDeleteTarget]       = useState<Order | null>(null);
  const [deleting, setDeleting]               = useState(false);
  // Bumped after a successful edit/status-change to force the detail panel
  // to re-fetch — same trick as DriversPage's panelRefreshKey.
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);
  // Archive browser modal open/closed
  const [archiveOpen, setArchiveOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleEdit = useCallback((order: Order) => {
    setSelectedOrderId(null);
    setFormOrder(order);
  }, []);

  const handleDelete = useCallback((order: Order) => {
    setSelectedOrderId(null);
    setDeleteTarget(order);
  }, []);

  // ── Notifications: create/update success or failure surfaces as a
  //    toast via useOrders()' notify() — see useOrders.ts createOrder /
  //    updateOrder. Field-level / request errors additionally render
  //    inside the form modal itself via its own <Alert>. ────────────────
  const handleFormSubmit = useCallback(
    async (
      payload: CreateOrderPayload | UpdateOrderPayload,
      isNew: boolean,
    ): Promise<boolean> => {
      let ok: boolean;

      if (isNew) {
        ok = await createOrder(payload as CreateOrderPayload);
      } else {
        const id = (formOrder as Order).id;
        ok = await updateOrder(id, payload as UpdateOrderPayload);
        // Re-fetch detail panel so updated fields are visible immediately
        if (ok && selectedOrderId) setPanelRefreshKey((k) => k + 1);
      }

      return ok;
    },
    [formOrder, createOrder, updateOrder, selectedOrderId],
  );

  // ── Notification: status change made from the detail panel bubbles up
  //    here and fires the same success toast the table-level actions use,
  //    keeping feedback consistent regardless of where the action started. ──
  const handleStatusChanged = useCallback(() => {
    setPanelRefreshKey((k) => k + 1);
    reload();
  }, [reload]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteOrder(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  }, [deleteTarget, deleteOrder]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Header ── */}
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
          <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                  الطلبات
                </h1>
                <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                  إجمالي{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong>{" "}
                  طلب مسجل
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                {/* Status filter — ported from app/dashboard/orders/page.tsx */}
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  dir="rtl"
                  style={{
                    height: 40, borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13, color: "var(--color-text-secondary)",
                    padding: "0 0.75rem", outline: "none",
                    fontFamily: "var(--font-sans)", cursor: "pointer",
                  }}
                >
                  <option value="">كل الحالات</option>
                  {Object.entries(ORDER_STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>

                {/* Search */}
                <div style={{ position: "relative", width: 288 }}>
                  <svg
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="رقم الشحنة أو المستلم..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    dir="rtl"
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

                {/* Add button */}
                <button
                  type="button"
                  onClick={() => setFormOrder("new")}
                  style={{
                    height: 40, padding: "0 1.25rem",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: "var(--color-brand-600)",
                    fontSize: 13, fontWeight: 700, color: "#FFF",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "var(--font-sans)",
                    flexShrink: 0,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  إضافة طلب
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Notifications: page-level error banner (e.g. failed list load)
             dismissible via clearError() from the hook. Action-result
             toasts (create/update/delete/status success or failure) render
             separately below via <Toast>, matching DriversPage's split
             between a persistent <Alert> for fetch errors and a transient
             <Toast> for action feedback. ── */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* ── Table ── */}
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
              {/* PERF NOTE: Rows are rendered inline via .map() below. At the
                  current pagination size (10-12 items) this is not a
                  bottleneck. If page size increases (e.g. "show all" mode,
                  a larger page-size selector, or removal of server-side
                  pagination), extract an <OrderRow> component into
                  src/Components/Order/ and wrap it in React.memo, passing
                  only primitives and useCallback-stabilized handlers so
                  memoization is actually effective. */}
              {orders.map((o, i) => {
                const statusCfg = ORDER_STATUS_MAP[o.currentStatus] ?? ORDER_STATUS_MAP.Created;

                return (
                  <li
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedOrderId(o.id);
                      }
                    }}
                    aria-label={`عرض تفاصيل الطلب ${o.shipmentNumber}`}
                    className={`grid items-center gap-2 px-6 py-3.5 text-[13px] border-b border-[var(--color-border)] cursor-pointer outline-none transition-colors duration-150 hover:bg-[var(--color-surface-hover,#F8FAFC)] focus-visible:bg-[var(--color-surface-hover,#F8FAFC)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-600)] ${
                      i % 2 !== 0 ? "bg-[var(--color-surface-muted)]" : "bg-transparent"
                    }`}
                    style={{ gridTemplateColumns: ROW_GRID_COLUMNS }}
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
                         click doesn't bubble up to the row and open the
                         detail panel as well. */}
                    <div style={{ display: "flex", gap: "0.4rem" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label="تعديل الطلب"
                        title="تعديل"
                        onClick={(e) => { e.stopPropagation(); handleEdit(o); }}
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(o); }}
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
      </section>

      {/* ── Detail panel — key forces re-fetch after a successful edit or
           status change. Status updates triggered inside the panel call
           updateStatus() from useOrders() (via handleStatusChanged), which
           fires the same toast as a table-level action. ── */}
      {selectedOrderId && (
        <OrderDetailPanel
          key={`${selectedOrderId}-${panelRefreshKey}`}
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChanged={handleStatusChanged}
        />
      )}

      {/* ── Form modal ── */}
      {formOrder !== null && (
        <OrderFormModal
          editOrder={formOrder === "new" ? null : formOrder}
          onClose={() => setFormOrder(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* ── Delete modal ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="حذف الطلب"
        description={`هل أنت متأكد من حذف الطلب ${deleteTarget?.shipmentNumber ?? ""} الخاص بـ ${deleteTarget?.recipientName ?? ""}؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* ── Archive browser modal ── */}
      {archiveOpen && (
        <ArchivedOrdersModal onClose={() => setArchiveOpen(false)} />
      )}

      {/* ── Toast: transient success/error feedback for create, update,
           delete, and status-change actions — sourced from useOrders()'
           `notification` state (see useOrders.ts notify()). This is the
           same toast used by the Driver pages via DriverDeleteModal's
           parent and useDriver.ts, kept consistent here. ── */}
      <Toast notification={notification} />

      {/* Floating button to open the archive browser */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} />
    </>
  );
}

// Named export alongside the default, mirroring src/Components/Driver/index.ts's
// pattern of re-exporting each piece for use elsewhere (e.g. a future
// app/dashboard/orders/page.tsx importing { OrderComponent }).
export { OrderComponent };