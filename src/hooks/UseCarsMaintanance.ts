"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { carMaintenanceService } from "@/src/services/carMaintanance.service";
import type {
  CarMaintenance,
  CreateMaintenancePayload,
  MaintenanceToastMsg,
  UpdateMaintenancePayload,
} from "../types/carMaintanance";

// ── useCarMaintenanceList ─────────────────────────────────────────────────────
// Loads every maintenance record for one car — used in the detail panel.

export function useCarMaintenanceList(carId: string | null) {
  const [records, setRecords] = useState<CarMaintenance[]>([]);
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
        const payload = (res as unknown as { data: { data: CarMaintenance[] } }).data ?? res;
        setRecords((payload as { data: CarMaintenance[] }).data ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [carId]);

  useEffect(() => { queueMicrotask(loadRecords); }, [loadRecords]);

  // Remove a record from the list right away, instead of waiting on a refetch.
  const removeRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { records, loading, error, loadRecords, removeRecord, setError };
}

// ── useCarMaintenanceDetail ───────────────────────────────────────────────────
// Fetches a single maintenance record by id.

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
          await carMaintenanceService.create(carId, payload as CreateMaintenancePayload, token);
          onSuccess("تم إضافة سجل الصيانة بنجاح.");
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
        // Show the backend's own message when it has one, otherwise a generic fallback.
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
        await carMaintenanceService.delete(carId, target.id, token);
        onDeleted(target.id);
        onSuccess("تم حذف سجل الصيانة بنجاح.");
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