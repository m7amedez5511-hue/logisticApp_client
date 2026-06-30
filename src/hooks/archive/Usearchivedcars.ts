"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { carService } from "@/src/services/car.service";
import type { Car } from "@/src/types/car";

const PAGE_SIZE = 12;

// ── useArchivedCars ───────────────────────────────────────────────────────────
// GET /cars/archived returns the full archived list at once (no page/search
// params on the backend), so pagination + search are done client-side here —
// mirrors the page/search/pages contract of useCars for a consistent UI.

export function useArchivedCars() {
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");

  const load = () => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    carService
      .getArchived(token)
      .then((res) => {
        const payload = (res as unknown as { data: { data: Car[] } }).data ?? res;
        setAllCars((payload as { data: Car[] }).data ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCars;
    const q = search.trim().toLowerCase();
    return allCars.filter(c =>
      c.manufacturer.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.plateNumber.toLowerCase().includes(q) ||
      c.plateLetters.toLowerCase().includes(q),
    );
  }, [allCars, search]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cars  = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    cars, loading, error, total, pages, page, search,
    setPage, handleSearch, refresh: load, setError,
  };
}