"use client";

import { useState, useCallback } from "react";
import { Alert, ArchiveButton, ConfirmDialog } from "@/src/Components/UI";
import { ArchivedDrivers } from "@/src/Components/Driver/archive/ArchivedDrivers";
import { DriverTable } from "@/src/Components/Driver/DriverTable";
import { useDrivers } from "@/src/hooks/useDriver";
import { CreateDriverPayload, Driver, UpdateDriverPayload } from "@/src/types/driver";
import { DriverDetailPanel, DriverFormModal , } from "@/src/Components/Driver";

// ── Page Component ────────────────────────────────────────────────────────────

export default function DriversPage() {
  const {
    drivers, loading, error, total, pages, page,
    search, setPage, handleSearch, clearError,
    createDriver, updateDriver, deleteDriver,
    notification,
  } = useDrivers();

  // ── Panel / modal state ───────────────────────────────────────────────────
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [formDriver, setFormDriver]             = useState<Driver | null | "new">(null);
  const [deleteTarget, setDeleteTarget]         = useState<Driver | null>(null);
  const [deleting, setDeleting]                 = useState(false);
  // Bumped after a successful edit to force the detail panel to re-fetch
  const [panelRefreshKey, setPanelRefreshKey]   = useState(0);
  // Archive browser modal open/closed
  const [archiveOpen, setArchiveOpen]           = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEdit = useCallback((driver: Driver) => {
    setSelectedDriverId(null);
    setFormDriver(driver);
  }, []);

  const handleDelete = useCallback((driver: Driver) => {
    setSelectedDriverId(null);
    setDeleteTarget(driver);
  }, []);

  const handleFormSubmit = useCallback(
    async (
      payload: CreateDriverPayload | UpdateDriverPayload,
      isNew: boolean,
    ): Promise<boolean> => {
      let ok: boolean;

      if (isNew) {
        ok = await createDriver(
          payload as CreateDriverPayload & {
            photo?: File;
            nationalPhoto?: File;
            driverCardPhoto?: File;
          },
        );
      } else {
        const id = (formDriver as Driver).id;
        ok = await updateDriver(
          id,
          payload as UpdateDriverPayload & {
            photo?: File;
            nationalPhoto?: File;
            driverCardPhoto?: File;
          },
        );
        // Re-fetch detail panel so updated status is visible immediately
        if (ok && selectedDriverId) setPanelRefreshKey((k) => k + 1);
      }

      return ok;
    },
    [formDriver, createDriver, updateDriver, selectedDriverId],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteDriver(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  }, [deleteTarget, deleteDriver]);

  // ── Render ────────────────────────────────────────────────────────────────
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
            إدارة الكوادر
          </p>
          <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                  السائقون
                </h1>
                <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                  إجمالي{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong>{" "}
                  سائق مسجل
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{ position: "relative", width: 288 }}>
                  <i
                    className="ti ti-search"
                    aria-hidden="true"
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                  />
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو الهاتف..."
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
                  onClick={() => setFormDriver("new")}
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
                  إضافة سائق
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Notifications ── */}
        {notification && (
          <Alert type={notification.type} message={notification.message} />
        )}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* ── Table ── */}
        <DriverTable
          drivers={drivers}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onPageChange={setPage}
          onRowClick={(d) => setSelectedDriverId(d.id)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </section>

      {/* ── Detail panel — key forces re-fetch after successful edit ── */}
      {selectedDriverId && (
        <DriverDetailPanel
          key={`${selectedDriverId}-${panelRefreshKey}`}
          driverId={selectedDriverId}
          onClose={() => setSelectedDriverId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ── Form modal ── */}
      {formDriver !== null && (
        <DriverFormModal
          editDriver={formDriver === "new" ? null : formDriver}
          branches={[]}
          onClose={() => setFormDriver(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* ── Delete modal ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="حذف السائق"
        description={`هل أنت متأكد من حذف ${deleteTarget?.name ?? ""} (${deleteTarget?.phone ?? ""})؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* ── Archive browser modal ── */}
      {archiveOpen && (
        <ArchivedDrivers onClose={() => setArchiveOpen(false)} />
      )}

      {/* ── Floating button to open the archive browser ── */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} />
    </>
  );
}