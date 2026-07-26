"use client";

// src/Components/Trip/TripFormModal.tsx
// CHANGE: renamed from Tripformmodal.tsx (proper PascalCase, matches
// UserFormModal.tsx / DriverFormModal.tsx). Split out of the old single-file
// Trip module into TripFormModal.tsx / TripTable.tsx / TripDetailModal.tsx.
// FIX 1: notes/endReason schema — empty string now transforms to undefined
// before .min() runs, so leaving them blank on create no longer fails
// validation despite .optional() (see trip.validator.ts).
// FIX 2: edit-mode defaultValues now fall back to the nested driver/car/branch
// ids, and setValue() re-applies the saved id once each dropdown's options
// actually load — previously the <select> had no matching <option> yet when
// defaultValues were first applied, so the old selection silently reset to "".

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal, Select, Textarea } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import {
  createTripSchema,
  updateTripSchema,
} from "@/src/validations/trip.validator";
import type {
  Trip,
  TripStatus,
  CreateTripPayload,
  UpdateTripPayload,
} from "@/src/types/trip";
import { carService, driverService } from "@/src/services";
import { branchService } from "@/src/services/branch.service";
import type { DriverOption } from "@/src/types/driver";
import type { CarOption } from "@/src/types/car";
import type { BranchOption } from "@/src/types/branch";

const FORM_ID = "trip-form";

// ── Shared styles ────────────────────────────────────────────────────────────
// Only for section headings — everything field-level now comes from the
// Input / Select / Textarea components themselves.

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "var(--color-text-hint)",
  fontWeight: 700,
  margin: "0.5rem 0 0",
};

// ── Form values shape ────────────────────────────────────────────────────────
// startTime/endTime store the ISO-8601 string (via setValueAs on register),
// while the <input type="datetime-local"> DOM element itself keeps showing
// the raw "YYYY-MM-DDTHH:mm" value the user typed — the transform only
// affects what's handed to the yup resolver and to onSubmit.

interface TripFormValues {
  title: string;
  driverId: string;
  carId: string;
  branchId: string;
  status: TripStatus;
  startTime: string;
  endTime: string;
  collectedCount: number | undefined;
  deliveredCount: number | undefined;
  returnedCount: number | undefined;
  totalCashCollected: number | undefined;
  notes: string;
  endReason: string;
  reason: string; // update-only
}

// ── Props ────────────────────────────────────────────────────────────────────

interface TripFormModalProps {
  editTrip: Trip | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateTripPayload | UpdateTripPayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TripFormModal({
  editTrip,
  onClose,
  onSubmit,
}: TripFormModalProps) {
  const isNew = editTrip === null;

  // ── Dropdown options ──────────────────────────────────────────────────────
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  // ── react-hook-form ────────────────────────────────────────────────────────
  // Moved above the dropdown-loading effect below: that effect calls
  // setValue(), so useForm() (which defines it) must run first — otherwise
  // setValue is referenced before its own initialization (TDZ ReferenceError).
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    // Cast both the schema argument and the resolver's result:
    // - argument: createTripSchema/updateTripSchema have structurally
    //   different shapes (create requires title/driverId/etc., update makes
    //   everything optional), so the ternary's type is a union yupResolver's
    //   single-schema signature won't accept.
    // - result: yup's inferred type for .optional() fields
    //   (`collectedCount?: number`) is structurally incompatible with
    //   TripFormValues's `collectedCount: number | undefined` — letting
    //   useForm<TripFormValues> alone establish the field-values type avoids
    //   that mismatch.
    resolver: yupResolver((isNew ? createTripSchema : updateTripSchema) as any) as any,
    defaultValues: {
      title: editTrip?.title ?? "",
      driverId: editTrip?.driverId ?? editTrip?.driver?.id ?? "",
      carId: editTrip?.carId ?? editTrip?.car?.id ?? "",
      branchId: editTrip?.branchId ?? editTrip?.branch?.id ?? "",
      status: editTrip?.status ?? "Scheduled",
      startTime: editTrip?.startTime?.slice(0, 16) ?? "",
      endTime: editTrip?.endTime?.slice(0, 16) ?? "",
      collectedCount: editTrip?.collectedCount ?? undefined,
      deliveredCount: editTrip?.deliveredCount ?? undefined,
      returnedCount: editTrip?.returnedCount ?? undefined,
      totalCashCollected:
        editTrip?.totalCashCollected != null ? Number(editTrip.totalCashCollected) : undefined,
      notes: editTrip?.notes ?? "",
      endReason: editTrip?.endReason ?? "",
      reason: "",
    },
  });

  useEffect(() => {
    const token = getStoredToken();

    driverService.getActiveOptions(token).then((list) => {
      setDrivers(list);
      // defaultValues were applied before this list existed, so the <select>
      // had no matching <option> yet and silently fell back to "" — reapply
      // the saved id now that the option actually exists in the DOM.
      const savedDriverId = editTrip?.driverId ?? editTrip?.driver?.id;
      if (savedDriverId) setValue("driverId", savedDriverId);
    }).catch(() => {});

    carService.getActiveOptions(token).then((list) => {
      setCars(list);
      const savedCarId = editTrip?.carId ?? editTrip?.car?.id;
      if (savedCarId) setValue("carId", savedCarId);
    }).catch(() => {});

    branchService.getOptions(token).then((list) => {
      setBranches(list);
      const savedBranchId = editTrip?.branchId ?? editTrip?.branch?.id;
      if (savedBranchId) setValue("branchId", savedBranchId);
    }).catch(() => {});
  }, [editTrip, setValue]);

  const [apiError, setApiError] = useState("");

  // register("title") already attaches its own ref — Input forwards it
  // through to the underlying <input>, so setFocus works with no separate
  // ref needed here.
  useEffect(() => {
    setFocus("title");
  }, [setFocus]);

  const numberField = (
    field: "collectedCount" | "deliveredCount" | "returnedCount" | "totalCashCollected",
  ) =>
    register(field, {
      setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
    });

  // datetime-local -> ISO-8601, applied at the RHF-value level only (DOM input
  // keeps showing the raw datetime-local string the user picked).
  const dateTimeField = (field: "startTime" | "endTime") =>
    register(field, {
      setValueAs: (v) => (v ? `${v}:00.000Z` : ""),
    });

  const titleError =
    errors.title && errors.title.type !== "manual" ? errors.title.message : undefined;

  // ── Submit ────────────────────────────────────────────────────────────────

  const submitHandler = async (data: TripFormValues) => {
    const raw: Record<string, unknown> = {
      title: data.title || undefined,
      driverId: data.driverId || undefined,
      carId: data.carId || undefined,
      branchId: data.branchId || undefined,
      status: data.status || undefined,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      collectedCount: data.collectedCount,
      deliveredCount: data.deliveredCount,
      returnedCount: data.returnedCount,
      totalCashCollected: data.totalCashCollected,
      notes: data.notes || undefined,
      endReason: data.endReason || undefined,
      ...(!isNew && data.reason ? { reason: data.reason } : {}),
    };

    setApiError("");
    try {
      const ok = await onSubmit(raw as CreateTripPayload | UpdateTripPayload, isNew);
      if (ok) {
        onClose();
      } else {
        setError("title", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
        setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
      setError("title", { message });
      setApiError(message);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isNew ? "إضافة رحلة جديدة" : "تعديل بيانات الرحلة"}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={isSubmitting}>
            {isNew ? "إضافة الرحلة" : "حفظ التغييرات"}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(submitHandler)}
        noValidate
        dir="rtl"
        className="flex flex-col gap-4"
      >
        {errors.title?.type === "manual" && (
          <Alert type="error" message={errors.title.message ?? ""} onClose={() => setApiError("")} />
        )}

        {/* ── Section: trip management ── */}
        <p style={sectionHeadingStyle}>أساسيات الرحلة</p>

        {/* Title */}
        <Input
          label="عنوان الرحلة *"
          error={titleError}
          {...register("title")}
          placeholder="مثال: توزيع الرياض الشمالي"
          dir="rtl"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {/* Driver */}
          <Select
            label="السائق *"
            error={errors.driverId?.message}
            {...register("driverId")}
            dir="rtl"
          >
            <option value="">اختر السائق</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.phone}
              </option>
            ))}
          </Select>

          {/* Car */}
          <Select
            label="السيارة *"
            error={errors.carId?.message}
            {...register("carId")}
            dir="rtl"
          >
            <option value="">اختر السيارة</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.manufacturer} {c.model} — {c.plateNumber}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {/* Branch */}
          <Select
            label="الفرع *"
            error={errors.branchId?.message}
            {...register("branchId")}
            dir="rtl"
          >
            <option value="">اختر الفرع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>

          {/* Status */}
          <Select label="الحالة" {...register("status")} dir="rtl">
            <option value="Scheduled">مجدولة</option>
            <option value="InProgress">جارية</option>
            <option value="Completed">مكتملة</option>
            <option value="Cancelled">ملغاة</option>
          </Select>
        </div>

        {/* ── Section: التوقيت ── */}
        <p style={sectionHeadingStyle}>التوقيت</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="وقت البدء"
            hint="اختياري"
            type="datetime-local"
            error={errors.startTime?.message}
            {...dateTimeField("startTime")}
          />
          <Input
            label="وقت الانتهاء"
            hint="اختياري"
            type="datetime-local"
            error={errors.endTime?.message}
            {...dateTimeField("endTime")}
          />
        </div>

        {/* ── Section: الأعداد والمبالغ ── */}
        <p style={sectionHeadingStyle}>الأعداد والمبالغ</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="المجمّع"
            hint="اختياري"
            type="number"
            min="0"
            error={errors.collectedCount?.message}
            {...numberField("collectedCount")}
            placeholder="0"
            dir="ltr"
          />
          <Input
            label="المُسلَّم"
            hint="اختياري"
            type="number"
            min="0"
            error={errors.deliveredCount?.message}
            {...numberField("deliveredCount")}
            placeholder="0"
            dir="ltr"
          />
          <Input
            label="المُرتجع"
            hint="اختياري"
            type="number"
            min="0"
            error={errors.returnedCount?.message}
            {...numberField("returnedCount")}
            placeholder="0"
            dir="ltr"
          />
          <Input
            label="النقد المحصّل"
            hint="اختياري"
            type="number"
            min="0"
            step="0.01"
            error={errors.totalCashCollected?.message}
            {...numberField("totalCashCollected")}
            placeholder="0.00"
            dir="ltr"
          />
        </div>

        {/* ── Section: ملاحظات ── */}
        <p style={sectionHeadingStyle}>ملاحظات</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Textarea
            label="ملاحظات"
            hint="اختياري"
            error={errors.notes?.message}
            {...register("notes")}
            placeholder="أي ملاحظات إضافية…"
            dir="rtl"
            className="h-[72px]"
          />
          <Textarea
            label="سبب الإنهاء"
            hint="اختياري"
            error={errors.endReason?.message}
            {...register("endReason")}
            placeholder="سبب إنهاء أو إلغاء الرحلة…"
            dir="rtl"
            className="h-[72px]"
          />
        </div>

        {/* reason — edit only (for reassigning driver/car) */}
        {!isNew && (
          <>
            <p style={sectionHeadingStyle}>سجل التغيير</p>
            <Input
              label="سبب التعديل"
              hint="مطلوب عند تغيير السائق أو السيارة"
              {...register("reason")}
              placeholder="مثال: تغيير السائق بسبب إجازة طارئة"
              dir="rtl"
            />
          </>
        )}
      </form>
    </Modal>
  );
}