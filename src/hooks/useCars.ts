"use client";


import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { carService } from "@/src/services/car.service";
import { get } from "@/src/services/api";
import type {
  Car,
  CarImage,
  CarListResponse,
  CreateCarPayload,
  ImageStage,
  ToastMsg,
  UpdateCarPayload,
} from "../types/car";

// ── useCars ───────────────────────────────────────────────────────────────────
// Manages the paginated car list for the main page.

export function useCars(page: number, search: string) {
  const [cars,    setCars]    = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);

  const loadCars = useCallback(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    const query = `?page=${page}&limit=12${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    get<CarListResponse>(`cars${query}`, token)
      .then((res) => {
        const payload = (res as unknown as { data: CarListResponse["data"] }).data ?? res;
        setCars((payload as CarListResponse["data"]).data ?? []);
        setTotal((payload as CarListResponse["data"]).meta?.total ?? 0);
        setPages((payload as CarListResponse["data"]).meta?.pages ?? 1);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { queueMicrotask(loadCars); }, [loadCars]);

  // Optimistic removal after delete
  const removeCar = useCallback((id: string) => {
    setCars(prev => prev.filter(c => c.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  return { cars, loading, error, total, pages, loadCars, removeCar, setError };
}

// ── useCarDetail ──────────────────────────────────────────────────────────────
// Fetches a single car by ID — used in CarDetailPanel. Exposes `refetch` so
// callers can re-sync the car (e.g. its currentStatus) after a maintenance
// record is created/updated/deleted elsewhere in the tree.

export function useCarDetail(carId: string) {
  const [car,     setCar]     = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loadCar = useCallback(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    carService
      .getById(carId, token)
      .then(res => setCar((res as unknown as { data: Car }).data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [carId]);

  useEffect(() => { queueMicrotask(loadCar); }, [loadCar]);

  return { car, loading, error, refetch: loadCar };
}

// ── useCarMutations ───────────────────────────────────────────────────────────
// Create, update, and delete operations — used in the main page.

interface UseCarMutationsOptions {
  onSuccess: (msg: string) => void;
  onError:   (msg: string) => void;
  onDeleted: (id: string) => void;
  getEditTarget: () => Car | null;
}

export function useCarMutations({
  onSuccess,
  onError,
  onDeleted,
  getEditTarget,
}: UseCarMutationsOptions) {
  const [deleting, setDeleting] = useState(false);

  const handleFormSubmit = useCallback(async (
    payload: CreateCarPayload | UpdateCarPayload,
    isNew: boolean,
  ): Promise<boolean> => {
    const token = getStoredToken();
    try {
      if (isNew) {
        await carService.create(payload as CreateCarPayload, token);
        onSuccess("تم إضافة المركبة بنجاح.");
      } else {
        const editTarget = getEditTarget();
        if (!editTarget) return false;
        await carService.update(editTarget.id, payload as UpdateCarPayload, token);
        onSuccess("تم تحديث بيانات المركبة.");
      }
      return true;
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "فشلت العملية.");
      return false;
    }
  }, [onSuccess, onError, getEditTarget]);

  const handleDeleteConfirm = useCallback(async (target: Car) => {
    setDeleting(true);
    const token = getStoredToken();
    try {
      await carService.delete(target.id, token);
      onDeleted(target.id);
      onSuccess(`تم حذف ${target.manufacturer} ${target.model} بنجاح.`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "فشل الحذف.");
    } finally {
      setDeleting(false);
    }
  }, [onSuccess, onError, onDeleted]);

  return { deleting, handleFormSubmit, handleDeleteConfirm };
}

// ── useToast ──────────────────────────────────────────────────────────────────
// Simple toast notification state.

export function useToast(duration = 3500) {
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const notify = useCallback((t: ToastMsg) => {
    setToast(t);
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, notify };
}

// ── useCarImages ──────────────────────────────────────────────────────────────
// Manages gallery images — used in CarImageGallery.

export function useCarImages(carId: string, sortBy: "asc" | "desc") {
  const [images,    setImages]    = useState<CarImage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await carService.getImages(carId, token, { sortBy });
      const raw = (res as unknown as { data: CarImage[] }).data ?? [];
      setImages(raw);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل الصور");
    } finally {
      setLoading(false);
    }
  }, [carId, sortBy]);

  useEffect(() => { queueMicrotask(fetchImages); }, [fetchImages]);

  const uploadImages = useCallback(async (files: File[], stage: ImageStage) => {
    setUploading(true);
    setError(null);
    try {
      const token = getStoredToken();
      await carService.uploadImages(carId, files, stage, token);
      await fetchImages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل رفع الصور");
    } finally {
      setUploading(false);
    }
  }, [carId, fetchImages]);

  const deleteImage = useCallback(async (imageId: string) => {
    setDeleting(imageId);
    setError(null);
    try {
      const token = getStoredToken();
      await carService.deleteImage(imageId, token);
      setImages(prev => prev.filter(img => img.id !== imageId));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل حذف الصورة");
      return false;
    } finally {
      setDeleting(null);
    }
  }, []);

  return {
    images,
    loading,
    uploading,
    deleting,
    error,
    setError,
    fetchImages,
    uploadImages,
    deleteImage,
  };
}