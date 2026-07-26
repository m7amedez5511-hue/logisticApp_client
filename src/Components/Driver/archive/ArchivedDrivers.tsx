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
  <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
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