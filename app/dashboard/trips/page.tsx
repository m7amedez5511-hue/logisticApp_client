"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTrips } from "@/hooks/useTrip";
import { tripService } from "@/services/trip.service";
import { getStoredToken } from "@/lib/auth";
import { TripFormModal } from "@/Components/Trip/Tripformmodal";
import { TripDeleteModal } from "@/Components/Trip/Tripdeletemodal";
import { Spinner } from "@/Components/UI";
import type { Trip, TripStatus, CreateTripPayload, UpdateTripPayload } from "@/types/trip";
import { TRIP_STATUS_MAP } from "@/types/trip";

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TripStatus }) {
  const s = TRIP_STATUS_MAP[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.02em",
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  const ok = type === "success";
  return (
    <div
      role="status"
      style={{
        position: "fixed", bottom: 24, insetInlineStart: 24, zIndex: 80,
        display: "flex", alignItems: "center", gap: 10,
        padding: "0.75rem 1.125rem",
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${ok ? "#BBF7D0" : "#FECACA"}`,
        background: ok ? "#DCFCE7" : "#FEF2F2",
        color: ok ? "#166534" : "#991B1B",
        boxShadow: "0 12px 32px rgba(0,0,0,.18)",
        fontSize: 13, fontWeight: 600,
        fontFamily: "var(--font-sans)",
      }}
    >
      {ok ? "✓" : "⚠"} {message}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const router = useRouter();
  const {
    trips, total, pages, loading, error,
    page, setPage,
    search, handleSearch,
    status, handleStatusFilter,
    deleteTrip, notification, reload,
  } = useTrips();

  // Local input value is debounced before it reaches the hook's `search`,
  // exactly like the table reloads only after the user stops typing.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchInput), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [showForm, setShowForm]         = useState(false);
  const [editTrip, setEditTrip]         = useState<Trip | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Create / update — called directly, same as the driver detail page ──────
  const handleSubmit = async (
    payload: CreateTripPayload | UpdateTripPayload,
    isNew: boolean,
  ): Promise<boolean> => {
    const token = getStoredToken();
    if (isNew) {
      await tripService.create(payload as CreateTripPayload, token);
    } else {
      await tripService.update(editTrip!.id, payload as UpdateTripPayload, token);
    }
    reload();
    return true;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteTrip(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  return (
    <div dir="rtl" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>الرحلات</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
            إدارة جدولة الرحلات وتتبع حالتها
          </p>
        </div>
        <button
          onClick={() => { setEditTrip(null); setShowForm(true); }}
          style={{
            height: 40, padding: "0 1.25rem",
            borderRadius: "var(--radius-md)", border: "none",
            background: "var(--color-brand-600)", color: "#FFF",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-sans)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          إضافة رحلة
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{
        display: "flex", gap: "0.75rem", flexWrap: "wrap",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "0.875rem 1rem",
      }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="بحث برقم الرحلة أو العنوان…"
          dir="rtl"
          style={{
            flex: 1, minWidth: 200, height: 38, padding: "0 0.75rem",
            borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)", fontSize: 13,
            color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", outline: "none",
          }}
        />
        <select
          value={status}
          onChange={e => handleStatusFilter(e.target.value as TripStatus | "")}
          dir="rtl"
          style={{
            height: 38, padding: "0 0.75rem", minWidth: 140,
            borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)", fontSize: 13,
            color: "var(--color-text-primary)", fontFamily: "var(--font-sans)",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="">كل الحالات</option>
          <option value="Scheduled">مجدولة</option>
          <option value="InProgress">جارية</option>
          <option value="Completed">مكتملة</option>
          <option value="Cancelled">ملغاة</option>
        </select>
      </div>

      {/* ── Table card ── */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      }}>

        {loading ? (
          <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-danger)", fontSize: 13 }}>
            ⚠ {error}
          </div>
        ) : trips.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
            لا توجد رحلات مطابقة
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                  {["رقم الرحلة", "العنوان", "السائق", "السيارة", "الحالة", "البدء", "الانتهاء", "إجراءات"].map(h => (
                    <th key={h} style={{
                      padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700,
                      color: "var(--color-text-secondary)", fontSize: 11,
                      letterSpacing: "0.03em", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, i) => (
                  <tr
                    key={trip.id}
                    onClick={() => router.push(`/dashboard/trips/${trip.id}`)}
                    style={{
                      borderBottom: i < trips.length - 1 ? "1px solid var(--color-border)" : "none",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-muted)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-brand-600)", fontWeight: 700 }}>
                        {trip.tripNumber}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "var(--color-text-primary)", maxWidth: 200 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {trip.title}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                      {trip.driver?.name ?? "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                      {trip.car ? `${trip.car.manufacturer} ${trip.car.model}` : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <StatusBadge status={trip.status} />
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {trip.startTime ? new Date(trip.startTime).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {trip.endTime ? new Date(trip.endTime).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => { setEditTrip(trip); setShowForm(true); }}
                          title="تعديل"
                          style={{
                            width: 30, height: 30, borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)", background: "var(--color-surface)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(trip)}
                          title="حذف"
                          style={{
                            width: 30, height: 30, borderRadius: "var(--radius-md)",
                            border: "1px solid #FECACA", background: "#FEF2F2",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#DC2626",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div style={{
            padding: "0.875rem 1rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--color-surface-muted)",
          }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {total} رحلة — صفحة {page} من {pages}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {[...Array(pages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  style={{
                    width: 32, height: 32, borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: page === idx + 1 ? "var(--color-brand-600)" : "var(--color-surface)",
                    color: page === idx + 1 ? "#FFF" : "var(--color-text-secondary)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showForm && (
        <TripFormModal
          editTrip={editTrip}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}
      {deleteTarget && (
        <TripDeleteModal
          trip={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Toast ── */}
      {notification && <Toast type={notification.type} message={notification.message} />}
    </div>
  );
}