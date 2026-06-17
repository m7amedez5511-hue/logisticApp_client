"use client";


import { useState, useCallback } from "react";
import { Alert, Spinner } from "@/Components/UI";
import { DriverFormModal } from "@/Components/Driver/DriverFormModal";
import { DriverDeleteModal } from "@/Components/Driver/DriverDeleteModal";
import { driverService } from "@/services";
import { getStoredToken } from "@/lib/auth";
import { useDrivers } from "@/hooks/useDriver";
import { CreateDriverPayload, Driver, DRIVER_STATUS_MAP, UpdateDriverPayload } from "@/types/driver";
import { DriverDetailPanel } from "@/Components/Driver/DriverDetailPanel";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function expirySoon(iso?: string | null): boolean {
  if (!iso) return false;
  return (new Date(iso).getTime() - Date.now()) / 86_400_000 <= 90;
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

// ── Page Component ────────────────────────────────────────────────────────────

export default function DriversPage() {
  const {
    drivers, loading, error, total, pages, page,
    search, setPage, handleSearch, clearError,
    deleteDriver, notification, reload,
  } = useDrivers();

  // ── Panel / modal state ───────────────────────────────────────────────────
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [formDriver, setFormDriver]             = useState<Driver | null | "new">(null);
  const [deleteTarget, setDeleteTarget]         = useState<Driver | null>(null);
  const [deleting, setDeleting]                 = useState(false);

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
      try {
        const token = getStoredToken();
        if (isNew) {
          // Use multipart if there are file fields
          const hasFiles =
            (payload as CreateDriverPayload & { photo?: File }).photo ||
            (payload as CreateDriverPayload & { nationalPhoto?: File }).nationalPhoto ||
            (payload as CreateDriverPayload & { driverCardPhoto?: File }).driverCardPhoto;

          if (hasFiles) {
            await driverService.createWithImages(
              payload as Parameters<typeof driverService.createWithImages>[0],
              token,
            );
          } else {
            await driverService.create(payload as CreateDriverPayload, token);
          }
        } else {
          const id = (formDriver as Driver).id;
          await driverService.update(id, payload as UpdateDriverPayload, token);
        }
        reload();
        return true;
      } catch {
        return false;
      }
    },
    [formDriver, reload],
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
                  <svg
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  إضافة سائق
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Notifications ── */}
        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
          />
        )}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* ── Table ── */}
        <div style={cardStyle}>
          <div
            dir="rtl"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.2fr 1fr 1.1fr 1.1fr 1fr",
              ...thStyle,
            }}
          >
            <span>السائق</span>
            <span>الفرع</span>
            <span>الجنسية</span>
            <span>انتهاء الرخصة</span>
            <span>انتهاء الهوية</span>
            <span>الحالة</span>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          ) : drivers.length === 0 ? (
            <p style={{ textAlign: "center", padding: "4rem 0", fontSize: 13, color: "var(--color-text-muted)" }}>
              لا توجد نتائج {search && `لـ "${search}"`}
            </p>
          ) : (
            <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {drivers.map((d, i) => {
                const statusCfg = DRIVER_STATUS_MAP[d.status] ?? DRIVER_STATUS_MAP.Inactive;
                const licWarn   = expirySoon(d.licenseExpiry);
                const idWarn    = expirySoon((d as Driver & { nationalIdExpiry?: string }).nationalIdExpiry);

                return (
                  <li
                    key={d.id}
                    onClick={() => setSelectedDriverId(d.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1.2fr 1fr 1.1fr 1.1fr 1fr",
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
                    {/* Name + phone */}
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{d.name}</p>
                      <p style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>{d.phone}</p>
                    </div>

                    {/* Branch */}
                    <span style={{ color: "var(--color-text-secondary)" }}>{d.branch?.name ?? "—"}</span>

                    {/* Nationality */}
                    <span style={{ color: "var(--color-text-secondary)" }}>{d.nationality ?? "—"}</span>

                    {/* License expiry */}
                    <span style={{ fontSize: 12, fontWeight: licWarn ? 600 : 400, color: licWarn ? "#D97706" : "var(--color-text-secondary)" }}>
                      {licWarn && "⚠ "}{fmtDate(d.licenseExpiry)}
                    </span>

                    {/* National ID expiry */}
                    <span style={{ fontSize: 12, fontWeight: idWarn ? 600 : 400, color: idWarn ? "#D97706" : "var(--color-text-secondary)" }}>
                      {idWarn && "⚠ "}{fmtDate((d as Driver & { nationalIdExpiry?: string }).nationalIdExpiry)}
                    </span>

                    {/* Status badge */}
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

      {/* ── Detail panel ── */}
      {selectedDriverId && (
        <DriverDetailPanel
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
      {deleteTarget && (
        <DriverDeleteModal
          driver={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}