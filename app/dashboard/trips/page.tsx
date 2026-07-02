"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTrips } from "@/src/hooks/useTrip";
import { TripFormModal } from "@/src/Components/Trip/Tripformmodal";
import { TripDeleteModal } from "@/src/Components/Trip/Tripdeletemodal";
import { ArchivedTripList } from "@/src/Components/Trip/archive/ArchivedTripList";
import { Alert, Spinner, ArchiveButton } from "@/src/Components/UI";
import { Toast } from "@/src/Components/UI/Toast";
import type {
  Trip,
  TripStatus,
  CreateTripPayload,
  UpdateTripPayload,
} from "@/src/types/trip";
import { TRIP_STATUS_MAP } from "@/src/types/trip";

// ── Status badge — same visual pattern as Driver's status badge ─────────────

function StatusBadge({ status }: { status: TripStatus }) {
  const s = TRIP_STATUS_MAP[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: "var(--radius-full)",
        border: `1px solid ${s.border}`,
        background: s.bg,
        padding: "0.2rem 0.625rem",
        fontSize: 11,
        fontWeight: 600,
        color: s.color,
        width: "fit-content",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}

// ── Archived trips modal — unchanged wrapper, kept as-is ────────────────────

function ArchivedTripsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archived-trips-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "2rem 1rem",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 920,
          background: "var(--color-surface-sunken)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        <div
          dir="rtl"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface)",
          }}
        >
          <h2
            id="archived-trips-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            أرشيف الرحلات
          </h2>
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
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          // Was pointing at the normal trip page — send it to the archived
          route instead
          <ArchivedTripList
            onView={(trip) =>
              router.push(`/dashboard/trips/archived/${trip.id}`)
            }
          />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const router = useRouter();

  // All list state + mutations now come from the hook, same as useDrivers
  // is used on the Driver page. No direct tripService calls in this file.
  const {
    trips,
    total,
    pages,
    loading,
    error,
    page,
    setPage,
    search,
    handleSearch,
    status,
    handleStatusFilter,
    createTrip,
    updateTrip,
    deleteTrip,
    notification,
    dismissNotification,
    clearError,
  } = useTrips();

  const [showForm, setShowForm] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Debounced search input, same pattern as the Driver page's search box
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchInput), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleEdit = useCallback((trip: Trip) => {
    setEditTrip(trip);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((trip: Trip) => {
    setDeleteTarget(trip);
  }, []);

  // ── Create / update — delegates to the hook (hook fires the toast) ───────
  const handleSubmit = async (
    payload: CreateTripPayload | UpdateTripPayload,
    isNew: boolean,
  ): Promise<boolean> => {
    if (isNew) {
      return createTrip(payload as CreateTripPayload);
    }
    return updateTrip(editTrip!.id, payload as UpdateTripPayload);
  };

  // ── Delete confirm — delegates to the hook ────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteTrip(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  return (
    <div
      dir="rtl"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "1.5rem 2rem",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#2563EB",
            fontWeight: 600,
          }}
        >
          إدارة العمليات
        </p>
        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                الرحلات
              </h1>
              <p
                style={{
                  marginTop: "0.25rem",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                }}
              >
                إجمالي{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {total}
                </strong>{" "}
                رحلة مسجلة
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Search */}
              <div style={{ position: "relative", width: 288 }}>
                <svg
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "var(--color-text-hint)",
                    pointerEvents: "none",
                  }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="بحث برقم الرحلة أو العنوان..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  dir="rtl"
                  style={{
                    width: "100%",
                    height: 40,
                    paddingRight: 36,
                    paddingLeft: 12,
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                    color: "var(--color-text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>

              {/* Status filter */}
              <select
                value={status}
                onChange={(e) =>
                  handleStatusFilter(e.target.value as TripStatus | "")
                }
                dir="rtl"
                style={{
                  height: 40,
                  padding: "0 0.75rem",
                  minWidth: 140,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  fontSize: 13,
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">كل الحالات</option>
                <option value="Scheduled">مجدولة</option>
                <option value="InProgress">جارية</option>
                <option value="Completed">مكتملة</option>
                <option value="Cancelled">ملغاة</option>
              </select>

              {/* Archive button */}
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                style={{
                  height: 40,
                  padding: "0 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-sans)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="5" rx="1" />
                  <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
                  <path d="M10 13h4" />
                </svg>
                أرشيف الرحلات
              </button>

              {/* Add button */}
              <button
                type="button"
                onClick={() => {
                  setEditTrip(null);
                  setShowForm(true);
                }}
                style={{
                  height: 40,
                  padding: "0 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--color-brand-600)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-sans)",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                إضافة رحلة
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Error handling: Alert banner for list/API errors ──
           Same pattern as the Driver page: a persistent banner tied to the
           hook's `error` state, dismissible via `clearError`. */}
      {error && <Alert type="error" message={error} onClose={clearError} />}

      {/* ── Table ── */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          dir="rtl"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 2fr 1.3fr 1.3fr 1fr 1.1fr 1.1fr 0.8fr",
            padding: "0.75rem 1.5rem",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--color-text-muted)",
            background: "var(--color-surface-muted)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span>رقم الرحلة</span>
          <span>العنوان</span>
          <span>السائق</span>
          <span>السيارة</span>
          <span>الحالة</span>
          <span>البدء</span>
          <span>الانتهاء</span>
          <span>إجراءات</span>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "4rem 0",
              color: "var(--color-text-muted)",
            }}
          >
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : trips.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "4rem 0",
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
            لا توجد رحلات مطابقة {search && `لـ "${search}"`}
          </p>
        ) : (
          <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {trips.map((trip, i) => (
              <li
                key={trip.id}
                onClick={() => router.push(`/dashboard/trips/${trip.id}`)}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.5fr 2fr 1.3fr 1.3fr 1fr 1.1fr 1.1fr 0.8fr",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1.5rem",
                  borderBottom: "1px solid var(--color-border)",
                  background:
                    i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "var(--color-surface-hover, #F8FAFC)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent")
                }
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--color-brand-600)",
                    fontWeight: 700,
                  }}
                >
                  {trip.tripNumber}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {trip.title}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {trip.driver?.name ?? "—"}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {trip.car
                    ? `${trip.car.manufacturer} ${trip.car.model}`
                    : "—"}
                </span>
                <StatusBadge status={trip.status} />
                <span
                  style={{ fontSize: 12, color: "var(--color-text-muted)" }}
                >
                  {trip.startTime
                    ? new Date(trip.startTime).toLocaleString("ar-SA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </span>
                <span
                  style={{ fontSize: 12, color: "var(--color-text-muted)" }}
                >
                  {trip.endTime
                    ? new Date(trip.endTime).toLocaleString("ar-SA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </span>

                {/* Inline row actions — stopPropagation so the click does not
                    also trigger navigation to the detail page. */}
                <div
                  style={{ display: "flex", gap: "0.4rem" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="تعديل الرحلة"
                    title="تعديل"
                    onClick={() => handleEdit(trip)}
                    style={{
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      flexShrink: 0,
                      border: "1px solid var(--color-brand-200)",
                      background: "var(--color-brand-50, #EFF6FF)",
                      color: "var(--color-brand-600)",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    aria-label="حذف الرحلة"
                    title="حذف"
                    onClick={() => handleDelete(trip)}
                    style={{
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      flexShrink: 0,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      color: "#DC2626",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ── Pagination — same pattern as Driver page ── */}
        {pages > 1 && (
          <div
            dir="rtl"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--color-border)",
              padding: "0.875rem 1.5rem",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              صفحة{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {page}
              </strong>{" "}
              من{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {pages}
              </strong>
              {" — "}
              {total} رحلة
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                {
                  label: "السابق",
                  action: () => setPage((p) => Math.max(1, p - 1)),
                  disabled: page === 1,
                },
                {
                  label: "التالي",
                  action: () => setPage((p) => Math.min(pages, p + 1)),
                  disabled: page === pages,
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-muted)",
                    padding: "0.375rem 0.875rem",
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
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

      {/* ── Form modal ── */}
      {showForm && (
        <TripFormModal
          editTrip={editTrip}
          onClose={() => setShowForm(false)}
          onSubmit={async (payload, isNew) => {
            const ok = await handleSubmit(payload, isNew);
            if (ok) setShowForm(false);
            return ok;
          }}
        />
      )}

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <TripDeleteModal
          trip={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* ── Archive browser modal ── */}
      {archiveOpen && (
        <ArchivedTripsModal onClose={() => setArchiveOpen(false)} />
      )}

      {/* ── Floating archive button — same component Driver page uses ── */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} label="الأرشيف" />

      <Toast notification={notification} onDismiss={dismissNotification} />
    </div>
  );
}
