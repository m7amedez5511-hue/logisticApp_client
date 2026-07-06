"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { carMaintenanceService } from "@/src/services/carMaintanance.service";
import type { CarMaintenance } from "@/src/types/carMaintanance";

const PAGE_SIZE = 12;

/**
 * useArchivedCarMaintenance
 * ─────────────────────────────────────────────────────────────────────────
 * Same contract as `useArchivedCars`: the backend returns the whole archived
 * list in one call, so pagination + search are handled client-side here.
 *
 * Pass a `carId` to scope to one vehicle (`GET /cars/:carId/maintenance/archived`),
 * or `null` to load every archived record system-wide (`GET /maintenance/archived`).
 */
export function useArchivedCarMaintenance(carId: string | null) {
  const [allRecords, setAllRecords] = useState<CarMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");

  const load = useCallback(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);

    const request = carId
      ? carMaintenanceService.getArchived(carId, token)
      : carMaintenanceService.getAllArchivedGlobal(token);

    request
      .then((res) => {
        const payload = (res as unknown as { data: { data: CarMaintenance[] } }).data ?? res;
        setAllRecords((payload as { data: CarMaintenance[] }).data ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [carId]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allRecords;
    const q = search.trim().toLowerCase();
    return allRecords.filter(r =>
      r.reason.toLowerCase().includes(q) ||
      (r.car
        ? `${r.car.manufacturer} ${r.car.model} ${r.car.plateLetters} ${r.car.plateNumber}`
            .toLowerCase()
            .includes(q)
        : false),
    );
  }, [allRecords, search]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const records = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    records, loading, error, total, pages, page, search,
    setPage, handleSearch, refresh: load, setError,
  };
}