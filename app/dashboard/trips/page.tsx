"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTrips } from "@/src/hooks/useTrip";
import { tripService } from "@/src/services/trip.service";
import { getStoredToken } from "@/src/lib/auth";
import { TripFormModal } from "@/src/Components/Trip/Tripformmodal";
import { TripDeleteModal } from "@/src/Components/Trip/Tripdeletemodal";
import { ArchivedTripList } from "@/src/Components/Trip/archive/ArchivedTripList";
import { Spinner, ArchiveButton } from "@/src/Components/UI";
import { Toast, type ToastNotification } from "@/src/Components/UI/Toast";
import type { Trip, TripStatus, CreateTripPayload, UpdateTripPayload } from "@/src/types/trip";
import { TRIP_STATUS_MAP } from "@/src/types/trip";

// ── API error extractor ────────────────────────────────────────────────────
// Same logic as the detail page / useTrip.ts — kept local so create/update
// here can notify independently of the list hook's own notification state.

function extractApiMessage(err: unknown, fallback: string): string {
  if (typeof err === "string" && err.trim()) return err.trim();

  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const responseData = (e["response"] as Record<string, unknown> | undefined)?.["data"];
    if (responseData && typeof responseData === "object") {
      const rd = responseData as Record<string, unknown>;
      if (typeof rd["message"] === "string" && rd["message"].trim()) return rd["message"];
      if (Array.isArray(rd["message"])) return (rd["message"] as string[]).join(" — ");
      if (typeof rd["error"] === "string" && rd["error"].trim()) return rd["error"];
    }
    if (typeof e["message"] === "string" && e["message"].trim()) return e["message"];
  }

  return fallback;
}

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

// ── Archived trips modal ─────────────────────────────────────────────────────
// Lightweight wrapper modal around <ArchivedTripList /> — mirrors the
// ArchivedUsersModal pattern used on the users page.

function ArchivedTripsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  // close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="archived-trips-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "2rem 1rem", overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 920,
          background: "var(--color-surface-sunken)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div dir="rtl" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}>
          <h2 id="archived-trips-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            أرشيف الرحلات
          </h2>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* body */}
        <div style={{ padding: "1.5rem" }}>
          <ArchivedTripList onView={trip => router.push(`/dashboard/trips/${trip.id}`)} />
        </div>
      </div>
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
    reload,
  } = useTrips();

  // ── Notifications (standalone — fired explicitly by every action below) ──
  const [notification, setNotification] = useState<ToastNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((n: ToastNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(n);
    timerRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  const dismissNotification = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

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
  // Archive browser modal open/closed
  const [archiveOpen, setArchiveOpen]   = useState(false);

  // ── Create / update — calls tripService directly and notifies explicitly ──
  const handleSubmit = async (
    payload: CreateTripPayload | UpdateTripPayload,
    isNew: boolean,
  ): Promise<boolean> => {
    try {
      const token = getStoredToken();
      if (isNew) {
        await tripService.create(payload as CreateTripPayload, token);
        notify({ type: "success", message: "تم إضافة الرحلة بنجاح." });
      } else {
        await tripService.update(editTrip!.id, payload as UpdateTripPayload, token);
        notify({ type: "success", message: "تم تحديث بيانات الرحلة بنجاح." });
      }
      reload();
      return true;
    } catch (err) {
      notify({
        type: "error",
        message: extractApiMessage(err, isNew ? "تعذّر إضافة الرحلة." : "تعذّر تحديث الرحلة."),
      });
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = getStoredToken();
      await tripService.delete(deleteTarget.id, token);
      notify({ type: "success", message: "تم حذف الرحلة بنجاح." });
      setDeleteTarget(null);
      reload();
    } catch (err) {
      notify({ type: "error", message: extractApiMessage(err, "تعذّر حذف الرحلة.") });
    } finally {
      setDeleting(false);
    }
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
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => setArchiveOpen(true)}
            style={{
              height: 40, padding: "0 1.25rem",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "var(--color-surface)", color: "var(--color-text-secondary)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="5" rx="1" />
              <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
              <path d="M10 13h4" />
            </svg>
            أرشيف الرحلات
          </button>
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
      {archiveOpen && (
        <ArchivedTripsModal onClose={() => setArchiveOpen(false)} />
      )}

      {/* ── Toast ── */}
      <Toast notification={notification} onDismiss={dismissNotification} />
    </div>
  );
}