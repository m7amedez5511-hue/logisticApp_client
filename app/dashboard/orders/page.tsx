"use client";



import { useState, useCallback } from "react";
import { Alert, Toast, ArchiveButton, ConfirmDialog } from "@/src/Components/UI";
import {  ORDER_STATUS_MAP } from "@/src/Components/Order/OrderDetailModel";
import { OrderTable } from "@/src/Components/Order/OrderTable";
import { ArchivedOrdersModal } from "@/src/Components/Order/archive/ArchivedOrdersModal";
import { useOrders } from "@/src/hooks/useOrder";
import type { CreateOrderPayload, Order, UpdateOrderPayload } from "@/src/types/order";
import { OrderFormModal ,  OrderDetailPanel} from "@/src/Components/Order";

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
                  <i
                    className="ti ti-search"
                    aria-hidden="true"
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                  />
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
                  <i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" />
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
        <OrderTable
          orders={orders}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          setPage={setPage}
          onRowClick={(orderId) => setSelectedOrderId(orderId)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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