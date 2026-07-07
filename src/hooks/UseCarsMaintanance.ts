"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { carMaintenanceService } from "@/src/services/carMaintanance.service";
import type {
  CarMaintenance,
  CreateMaintenancePayload,
  MaintenanceToastMsg,
  UpdateMaintenancePayload,
} from "../types/carMaintanance";

// ── useCarMaintenanceList ─────────────────────────────────────────────────────
// Loads every maintenance record for one car — used in the detail panel/page
// and (with includeDeleted: true) to look up a single record by id without
// hitting the per-record backend endpoint.
//
// Always sorted newest-first by createdAt, per spec (defensive: sorts
// client-side even if the API already returns it in this order).
//
// By default only non-deleted (isDeleted !== true) records are returned —
// pass { includeDeleted: true } to get everything, e.g. so a detail view can
// still resolve an archived record's data.

export function useCarMaintenanceList(
  carId: string | null,
  options?: { includeDeleted?: boolean },
) {
  const includeDeleted = options?.includeDeleted ?? false;

  const [allRecords, setAllRecords] = useState<CarMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loadRecords = useCallback(() => {
    if (!carId) return;
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    carMaintenanceService
      .getAll(carId, token)
      .then((res) => {
        const list = (res as unknown as { data: CarMaintenance[] }).data ?? [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllRecords(list);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [carId]);

  useEffect(() => { queueMicrotask(loadRecords); }, [loadRecords]);

  const records = useMemo(
    () => (includeDeleted ? allRecords : allRecords.filter((r) => !r.isDeleted)),
    [allRecords, includeDeleted],
  );

  // Remove a record from the list right away, instead of waiting on a refetch.
  const removeRecord = useCallback((id: string) => {
    setAllRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { records, loading, error, loadRecords, removeRecord, setError };
}

// ── useCarMaintenanceDetail ───────────────────────────────────────────────────
// Fetches a single maintenance record by id.
// NOTE: relies on GET /cars/:carId/maintenance/:maintenanceId, which isn't
// wired up on the backend yet (404s). Prefer useCarMaintenanceList with
// includeDeleted: true + Array.find(id) until that route exists — see the
// maintenance detail page for the pattern.

export function useCarMaintenanceDetail(carId: string | null, maintenanceId: string | null) {
  const [record,  setRecord]  = useState<CarMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loadRecord = useCallback(() => {
    if (!carId || !maintenanceId) return;
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    carMaintenanceService
      .getById(carId, maintenanceId, token)
      .then((res) => setRecord((res as unknown as { data: CarMaintenance }).data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [carId, maintenanceId]);

  useEffect(() => { queueMicrotask(loadRecord); }, [loadRecord]);

  return { record, loading, error };
}

// ── useCarArchivedMaintenance ─────────────────────────────────────────────────
// GET /cars/:carId/maintenance/archived — soft-deleted records for one car.
// Not auto-loaded; call `load()` when the person opens an "archive" tab/view.

export function useCarArchivedMaintenance(carId: string | null) {
  const [records, setRecords] = useState<CarMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(() => {
    if (!carId) return;
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    carMaintenanceService
      .getArchived(carId, token)
      .then((res) => {
        const list = (res as unknown as { data: CarMaintenance[] }).data ?? [];
        setRecords(list);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [carId]);

  return { records, loading, error, load };
}

// ── useGlobalArchivedMaintenance ──────────────────────────────────────────────
// GET /maintenance/archived — every soft-deleted record, any car (admin view).
// Not auto-loaded; call `load()` when the admin page mounts / tab opens.

export function useGlobalArchivedMaintenance() {
  const [records, setRecords] = useState<CarMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    carMaintenanceService
      .getAllArchivedGlobal(token)
      .then((res) => {
        const list = (res as unknown as { data: CarMaintenance[] }).data ?? [];
        setRecords(list);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { records, loading, error, load };
}

// ── useCarMaintenanceMutations ────────────────────────────────────────────────
// Create, update, and soft-delete operations for maintenance records.

interface UseCarMaintenanceMutationsOptions {
  carId: string;
  onSuccess: (msg: string) => void;
  onError:   (msg: string) => void;
  onDeleted: (id: string) => void;
  getEditTarget: () => CarMaintenance | null;
}

export function useCarMaintenanceMutations({
  carId,
  onSuccess,
  onError,
  onDeleted,
  getEditTarget,
}: UseCarMaintenanceMutationsOptions) {
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFormSubmit = useCallback(
    async (
      payload: CreateMaintenancePayload | UpdateMaintenancePayload,
      isNew: boolean,
    ): Promise<boolean> => {
      const token = getStoredToken();
      setSaving(true);
      try {
        if (isNew) {
          // POST /cars/:carId/maintenance — creates the record AND flips
          // the car's status to "InMaintenance" on the backend.
          await carMaintenanceService.create(carId, payload as CreateMaintenancePayload, token);
          onSuccess("تم إضافة سجل الصيانة بنجاح، وتم تحديث حالة المركبة إلى صيانة.");
        } else {
          const editTarget = getEditTarget();
          if (!editTarget) return false;
          await carMaintenanceService.update(
            carId,
            editTarget.id,
            payload as UpdateMaintenancePayload,
            token,
          );
          onSuccess("تم تحديث سجل الصيانة.");
        }
        return true;
      } catch (err: unknown) {
        onError(err instanceof Error ? err.message : "فشلت العملية.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [carId, onSuccess, onError, getEditTarget],
  );

  const handleDeleteConfirm = useCallback(
    async (target: CarMaintenance) => {
      setDeleting(true);
      const token = getStoredToken();
      try {
        // DELETE /cars/:carId/maintenance/:maintenanceId — soft-deletes the
        // record; backend reverts car status to "Active" and logs the
        // transition in CarStatusHistory.
        await carMaintenanceService.delete(carId, target.id, token);
        onDeleted(target.id);
        onSuccess("تم حذف سجل الصيانة، وتم إرجاع حالة المركبة إلى نشط.");
      } catch (err: unknown) {
        onError(err instanceof Error ? err.message : "فشل الحذف.");
      } finally {
        setDeleting(false);
      }
    },
    [carId, onSuccess, onError, onDeleted],
  );

  return { saving, deleting, handleFormSubmit, handleDeleteConfirm };
}

// ── useMaintenanceToast ────────────────────────────────────────────────────────
// Simple toast notification state, same shape as useCars' useToast.

export function useMaintenanceToast(duration = 3500) {
  const [toast, setToast] = useState<MaintenanceToastMsg | null>(null);

  const notify = useCallback(
    (t: MaintenanceToastMsg) => {
      setToast(t);
      setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  return { toast, notify };
}