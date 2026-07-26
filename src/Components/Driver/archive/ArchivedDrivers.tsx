"use client";

import { useState } from "react";
import { Input, Modal, Toast } from "../../UI";
import { ArchivedDriverTable } from "./ArchivedDriverTable";
import { ArchivedDriverDetailModal } from "./ArchivedDriverDetailModal";
import { useArchivedDrivers } from "@/src/hooks/archive/useArchivedDrivers";

interface ArchivedDriversProps {
  onClose: () => void;
}

const searchIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

/**
 * Top-level modal for browsing archived drivers. Wires the
 * useArchivedDrivers hook to the table and detail modal, mirroring
 * ArchivedUsersModal's structure and behavior for drivers.
 */
export function ArchivedDrivers({ onClose }: ArchivedDriversProps) {
  const [viewDriverId, setViewDriverId] = useState<string | null>(null);

  const {
    drivers, loading, total, pages, notification,
    page, search,
    setPage, handleSearch, clearNotification,
  } = useArchivedDrivers();

  return (
    <>
      {viewDriverId && (
        <ArchivedDriverDetailModal driverId={viewDriverId} onClose={() => setViewDriverId(null)} />
      )}

      <Modal
        open
        onClose={onClose}
        size="lg"
        subtitle="الأرشيف"
        title={`السائقون المؤرشفون (${total})`}
      >
        <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* search */}
          <div style={{ maxWidth: 320 }}>
            <Input
              label="بحث"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              icon={searchIcon}
              dir="rtl"
            />
          </div>

          <Toast notification={notification} onDismiss={clearNotification} />

          <ArchivedDriverTable
            drivers={drivers}
            loading={loading}
            search={search}
            page={page}
            pages={pages}
            onView={driver => setViewDriverId(driver.id)}
            onPageChange={setPage}
          />
        </div>
      </Modal>
    </>
  );
}