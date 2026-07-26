"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedCarMaintenanceTable } from "./ArchivedCarMaintananceTable";
import { ArchivedCarMaintenanceDetailPanel } from "./ArchivedCarMaintananceDetailpanel";
import { useArchivedCarMaintenance } from "@/src/hooks/archive/UseArchivedCarsMaintanance";
import type { CarMaintenance } from "@/src/types/carMaintanance";

interface ArchivedCarsMaintenanceModalProps {
  /** A car's id to scope the archive to one vehicle, or `null` for the global (all-cars) archive. */
  carId: string | null;
  /** Shown in the header, e.g. "تويوتا لاند كروزر — أ ب ج 1234". Ignored for the global view. */
  carLabel?: string;
  onClose: () => void;
}

export function ArchivedCarsMaintenanceModal({ carId, carLabel, onClose }: ArchivedCarsMaintenanceModalProps) {
  const [viewRecord, setViewRecord] = useState<CarMaintenance | null>(null);

  const {
    records, loading, total, pages, error,
    page, search,
    setPage, handleSearch, setError,
  } = useArchivedCarMaintenance(carId);

  return (
    <Modal
      open
      title={`سجلات الصيانة المؤرشفة${carLabel ? ` — ${carLabel}` : ""} (${total})`}
      subtitle="الأرشيف"
      onClose={onClose}
      size="lg"
    >
      {viewRecord && (
        <ArchivedCarMaintenanceDetailPanel
          record={viewRecord}
          loading={false}
          error={null}
          onClose={() => setViewRecord(null)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ maxWidth: 320 }}>
          <Input
            label="بحث"
            type="text"
            placeholder="بحث بسبب الصيانة..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            dir="rtl"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            }
          />
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <ArchivedCarMaintenanceTable
          records={records}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          showCar={!carId}
          onView={record => setViewRecord(record)}
          onPageChange={setPage}
        />
      </div>
    </Modal>
  );
}