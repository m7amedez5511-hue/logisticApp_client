"use client";

// app/dashboard/trips/page.tsx
// CHANGE: replaced the old hand-rolled inline table with <TripTable/>.
// CHANGE: TripFormModal now imported from the barrel (@/src/Components/Trip)
// instead of a direct path — avoids the Tripformmodal.tsx case-sensitivity
// mismatch that breaks on case-sensitive filesystems (Linux/Docker builds).
// CHANGE: removed the local ArchivedTripsModal wrapper (it duplicated what
// the new ArchivedTripModal already does — search bar + table + detail) and
// removed the ArchivedTripList import; now renders <ArchivedTripModal/>
// directly.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTrips } from "@/src/hooks/useTrip";
import { TripFormModal, TripTable } from "@/src/Components/Trip";
import { ArchivedTripModal } from "@/src/Components/Trip/archive/ArchivedTripModal";
import { Alert, ArchiveButton, ConfirmDialog, Toast } from "@/src/Components/UI";
import type { Trip, CreateTripPayload, UpdateTripPayload } from "@/src/types/trip";
import Header from "@/src/Components/UI/Header";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const router = useRouter();

  // All list state + mutations come from the hook, same as useDrivers is
  // used on the Driver page. No direct tripService calls in this file.
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

  // TripTable exposes a dedicated "view" action (icon button) instead of a
  // row click — wired to the trip detail page, same destination the old
  // row-click handler used to navigate to.
  const handleView = useCallback(
    (trip: Trip) => router.push(`/dashboard/trips/${trip.id}`),
    [router],
  );

  const handleAdd = useCallback(() => {
    setEditTrip(null);
    setShowForm(true);
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
      <Header
        mainTitle="إدارة الرحلات"
        title="الرحلات"
        name="رحلة"
        state={{ total }}
        search={search}
        setSearch={handleSearch}
        module=""
        setModule={() => {}}
        setPage={setPage}
        isAudit={false}
        onAdd={handleAdd}
      />

      {/* ── Error handling: Alert banner for list/API errors ──
           Same pattern as the Driver page: a persistent banner tied to the
           hook's `error` state, dismissible via `clearError`. */}
      {error && <Alert type="error" message={error} onClose={clearError} />}

      {/* ── Table ── */}
      <TripTable
        trips={trips}
        loading={loading}
        search={search}
        page={page}
        pages={pages}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onAddFirst={handleAdd}
        onPageChange={setPage}
      />

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
      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="حذف الرحلة"
        description={`هل أنت متأكد من حذف رحلة ${deleteTarget?.title ?? ""} (${deleteTarget?.tripNumber ?? ""})؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      {/* ── Archive browser modal — now the split ArchivedTripModal directly,
           no local wrapper needed since it already ships its own search bar,
           table, and detail-view wiring. ── */}
      {archiveOpen && <ArchivedTripModal onClose={() => setArchiveOpen(false)} />}

      {/* ── Floating archive button — same component Driver page uses ── */}
      <ArchiveButton onClick={() => setArchiveOpen(true)} label="الأرشيف" />

      <Toast notification={notification} onDismiss={dismissNotification} />
    </div>
  );
}