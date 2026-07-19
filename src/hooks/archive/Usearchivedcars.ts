"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { carService } from "@/src/services/car.service";
import type { Car } from "@/src/types/car";

const PAGE_SIZE = 12;

export function useArchivedCars() {
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");

  const load = useCallback(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    carService
      .getArchived(token)
      .then((res) => {
        setAllCars(res ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

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