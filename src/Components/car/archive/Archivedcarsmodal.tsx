"use client";

import { useState } from "react";
import { Alert, Input, Modal } from "../../UI";
import { ArchivedCarTable } from "./Archivedcartable";
import { ArchivedCarDetailPanel } from "./Archivedcardetailpanel";
import { useArchivedCars } from "@/src/hooks/archive/Usearchivedcars";
import type { Car } from "@/src/types/car";

interface ArchivedCarsModalProps {
  onClose: () => void;
}

export function ArchivedCarsModal({ onClose }: ArchivedCarsModalProps) {
  const [viewCar, setViewCar] = useState<Car | null>(null);

  const {
    cars, loading, total, pages, error,
    page, search,
    setPage, handleSearch, setError,
  } = useArchivedCars();

  return (
    <Modal
      open
      title={`المركبات المؤرشفة (${total})`}
      subtitle="الأرشيف"
      onClose={onClose}
      size="lg"
    >
      {viewCar && (
        <ArchivedCarDetailPanel
          car={viewCar}
          loading={false}
          error={null}
          onClose={() => setViewCar(null)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* search */}
        <div style={{ maxWidth: 320 }}>
          <Input
            label="بحث"
            type="text"
            placeholder="بحث بالماركة أو اللوحة..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            dir="rtl"
            icon={
              <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
            }
          />
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <ArchivedCarTable
          cars={cars}
          loading={loading}
          search={search}
          page={page}
          pages={pages}
          onView={car => setViewCar(car)}
          onPageChange={setPage}
        />
      </div>
    </Modal>
  );
}