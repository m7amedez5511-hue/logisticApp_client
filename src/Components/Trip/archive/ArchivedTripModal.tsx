"use client";



import { useState } from "react";
import { Alert, Input, Modal } from "@/src/Components/UI";
import { ArchivedTripTable } from "./ArchivedTripTable";
import { ArchivedTripDetailModal } from "./ArchivedtripDetailModal";
import { useArchivedTrips } from "@/src/hooks/archive/useArchivedTrips";

interface ArchivedTripModalProps {
  onClose: () => void;
}

const searchIcon = (
  <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
);

/**
 * Top-level modal for browsing archived trips. Wires the useArchivedTrips
 * hook to the table and detail modal, mirroring ArchivedDrivers/
 * ArchivedUsersModal's structure and behavior.
 */
export function ArchivedTripModal({ onClose }: ArchivedTripModalProps) {
  const [viewTripId, setViewTripId] = useState<string | null>(null);

  const {
    trips, loading, total, pages, error,
    page, search,
    setPage, handleSearch, clearError,
  } = useArchivedTrips();

  return (
    <>
      {viewTripId && (
        <ArchivedTripDetailModal tripId={viewTripId} onClose={() => setViewTripId(null)} />
      )}

      <Modal
        open
        onClose={onClose}
        size="lg"
        subtitle="الأرشيف"
        title={`الرحلات المؤرشفة (${total})`}
      >
        <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ maxWidth: 320 }}>
            <Input
              label="بحث"
              placeholder="بحث برقم الرحلة أو العنوان..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              icon={searchIcon}
              dir="rtl"
            />
          </div>

          {error && <Alert type="error" message={error} onClose={clearError} />}

          <ArchivedTripTable
            trips={trips}
            loading={loading}
            search={search}
            page={page}
            pages={pages}
            onView={trip => setViewTripId(trip.id)}
            onPageChange={setPage}
          />
        </div>
      </Modal>
    </>
  );
}