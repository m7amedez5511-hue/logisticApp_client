"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal, Select } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { useEditFormSync } from "@/src/hooks/useEditFormSync";
import {
  createCarSchema,
  updateCarSchema,
} from "@/src/validations/car.validator";
import type {
  Car,
  CreateCarPayload,
  InsuranceStatus,
  UpdateCarPayload,
} from "@/src/types/car";
import type { Branch } from "@/src/types/branch";
import { branchService } from "@/src/services/branch.service";

// ── Shared styles ─────────────────────────────────────────────────────────────
// Only section-heading styling is left here — every input/select/label/error
// visual is now owned by the shared <Input /> / <Select /> components.

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "var(--color-text-hint)",
  fontWeight: 700,
  margin: "0.5rem 0 0",
};

const FORM_ID = "car-form";

// ── Date helper ───────────────────────────────────────────────────────────────
// <input type="date"> gives "YYYY-MM-DD"; backend expects full ISO-8601.

function toIsoDateTime(val: string): string {
  if (!val) return val;
  if (val.includes("T")) return val;
  return `${val}T00:00:00.000Z`;
}

// ── Form values shape ─────────────────────────────────────────────────────────
// Mirrors the subset of CreateCarPayload/UpdateCarPayload actually edited here.

interface CarFormValues {
  manufacturer: string;
  model: string;
  color: string;
  plateNumber: string;
  plateLetters: string;
  plateType: string;
  registrationNumber: string;
  vinNumber: string;
  branchId: string;
  currentStatus: Car["currentStatus"];
  insuranceStatus: InsuranceStatus;
  registrationExpiryDate: string;
  insuranceExpiryDate: string;
  inspectionExpiryDate: string;
  gpsDeviceId: string;
  year: number | undefined;
  capacity: number | undefined;
  weight: number | undefined;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarFormModalProps {
  editCar: Car | null;
  /** Pass pre-loaded branches or an empty array — the modal will auto-fetch if empty. */
  branches: Branch[];
  onClose: () => void;
  onSubmit: (
    payload: CreateCarPayload | UpdateCarPayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarFormModal({
  editCar,
  branches: branchesProp,
  onClose,
  onSubmit,
}: CarFormModalProps) {
  const isNew = editCar === null;

  // ── react-hook-form ────────────────────────────────────────────────────────
  // Moved above the branches-loading effect below: that effect calls
  // setValue(), so useForm() (which defines it) must run first — otherwise
  // setValue is referenced before its own initialization (TDZ ReferenceError),
  // same issue already fixed in TripFormModal / DriverFormModal.
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CarFormValues>({
    // Cast both the schema argument and the resolver's result — same fix
    // already applied in TripFormModal/DriverFormModal: createCarSchema/
    // updateCarSchema have structurally different required fields (union
    // type yupResolver's single-schema signature won't accept), and yup's
    // inferred type for .optional() fields is structurally incompatible
    // with CarFormValues.
    resolver: yupResolver((isNew ? createCarSchema : updateCarSchema) as any) as any,
    defaultValues: {
      manufacturer: editCar?.manufacturer ?? "",
      model: editCar?.model ?? "",
      color: editCar?.color ?? "",
      plateNumber: editCar?.plateNumber ?? "",
      plateLetters: editCar?.plateLetters ?? "",
      plateType: editCar?.plateType ?? "",
      registrationNumber: editCar?.registrationNumber ?? "",
      vinNumber: editCar?.vinNumber ?? "",
      branchId: editCar?.branch?.id ?? "",
      currentStatus: editCar?.currentStatus ?? "Active",
      insuranceStatus: (editCar?.insuranceStatus as InsuranceStatus) ?? "Valid",
      registrationExpiryDate: editCar?.registrationExpiryDate?.slice(0, 10) ?? "",
      insuranceExpiryDate: editCar?.insuranceExpiryDate?.slice(0, 10) ?? "",
      inspectionExpiryDate: editCar?.inspectionExpiryDate?.slice(0, 10) ?? "",
      gpsDeviceId: editCar?.gpsDeviceId ?? "",
      // NOTE: kept as number | undefined instead of RHF's valueAsNumber so an
      // empty input maps to `undefined` (matches the old parseNum() guard)
      // rather than NaN, which would otherwise trip the yup .typeError() rule.
      year: editCar?.year ?? new Date().getFullYear(),
      capacity: editCar?.capacity ?? undefined,
      weight: editCar?.weight ?? undefined,
    },
  });

 // ── Local branches (auto-fetched if prop is empty) ─────────────────────────
const [branches, setBranches] = useState<Branch[]>(branchesProp);
const loadBranches = useCallback(() => {
  if (branchesProp.length > 0) {
    queueMicrotask(() => setBranches(branchesProp));
    return;
  }
  const token = getStoredToken();
  branchService
    .getOptions(token)
    .then((list) => {
      queueMicrotask(() => setBranches(list as unknown as Branch[]));
    })
    .catch(() => {
      /* silently ignore */
    });
}, [branchesProp]);

useEffect(() => {
  loadBranches();
}, [loadBranches]);

// CHANGE: replaced the manual `if (savedBranchId) setValue("branchId", ...)`
// calls above with useEditFormSync.
useEditFormSync(setValue, "branchId", editCar?.branch?.id, branches);

  const [apiError, setApiError] = useState("");

  // register("manufacturer") already provides a ref for this input, so we
  // focus it via RHF's setFocus instead of a separate useRef — assigning
  // both `ref={firstRef}` and `{...register(...)}` on the same element
  // causes the second ref to silently overwrite the first.
  useEffect(() => {
    setFocus("manufacturer");
  }, [setFocus]);

  // Numeric fields: empty string -> undefined (never NaN), matching the
  // behavior of the old parseNum() helper.
  const numberField = (
    field: "year" | "capacity" | "weight",
  ) =>
    register(field, {
      setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
    });

  // ── Submit ────────────────────────────────────────────────────────────────

  const submitHandler = async (data: CarFormValues) => {
    // Build final payload — convert date strings to ISO-8601 for the backend,
    // and drop empty-optional fields exactly like the pre-refactor version did.
    const raw: Record<string, unknown> = {
      manufacturer: data.manufacturer,
      model: data.model,
      year: data.year,
      plateNumber: data.plateNumber,
      plateLetters: data.plateLetters,
      currentStatus: data.currentStatus,
    };
    if (data.color) raw.color = data.color;
    if (data.plateType) raw.plateType = data.plateType;
    if (data.registrationNumber) raw.registrationNumber = data.registrationNumber;
    if (data.vinNumber) raw.vinNumber = data.vinNumber;
    if (data.branchId) raw.branchId = data.branchId;
    if (data.insuranceStatus) raw.insuranceStatus = data.insuranceStatus;
    if (data.registrationExpiryDate)
      raw.registrationExpiryDate = toIsoDateTime(data.registrationExpiryDate);
    if (data.insuranceExpiryDate)
      raw.insuranceExpiryDate = toIsoDateTime(data.insuranceExpiryDate);
    if (data.inspectionExpiryDate)
      raw.inspectionExpiryDate = toIsoDateTime(data.inspectionExpiryDate);
    if (data.gpsDeviceId) raw.gpsDeviceId = data.gpsDeviceId;
    // Defensive re-coercion: mirrors CarMaintenanceFormModal's
    // toNumberOrUndefined() safeguard, in case capacity/weight ever round-trip
    // as numeric strings from a Decimal-backed field on the backend.
    if (data.capacity !== undefined && data.capacity !== null && !Number.isNaN(Number(data.capacity)))
      raw.capacity = Number(data.capacity);
    if (data.weight !== undefined && data.weight !== null && !Number.isNaN(Number(data.weight)))
      raw.weight = Number(data.weight);

    const payload = raw as unknown as CreateCarPayload;
    setApiError("");
    const ok = await onSubmit(payload, isNew);
    if (ok) {
      onClose();
    } else {
      setError("manufacturer", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
      setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      open
      title={isNew ? "مركبة جديدة" : `${editCar?.manufacturer} ${editCar?.model}`}
      subtitle={isNew ? "إضافة مركبة" : "تعديل مركبة"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {isNew ? "إضافة المركبة" : "حفظ التغييرات"}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(submitHandler)}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        dir="rtl"
      >
        {errors.manufacturer?.type === "manual" && (
          <Alert
            type="error"
            message={errors.manufacturer.message ?? ""}
            onClose={() => setApiError("")}
          />
        )}

        {/* ── Section: Basic Info ── */}
        <p style={sectionHeadingStyle}>بيانات أساسية</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="الشركة المصنعة *"
            {...register("manufacturer")}
            error={
              errors.manufacturer && errors.manufacturer.type !== "manual"
                ? errors.manufacturer.message
                : undefined
            }
            placeholder="تويوتا"
            dir="rtl"
            autoComplete="off"
          />
          <Input
            label="الموديل *"
            {...register("model")}
            error={errors.model?.message}
            placeholder="لاند كروزر"
            dir="rtl"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="سنة الصنع *"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            {...numberField("year")}
            error={errors.year?.message}
            dir="ltr"
          />
          <Input label="اللون" {...register("color")} placeholder="أبيض" dir="rtl" />
          <Input label="نوع اللوحة" {...register("plateType")} placeholder="خاص" dir="rtl" />
        </div>

        {/* ── Section: Plate ── */}
        <p style={sectionHeadingStyle}>بيانات اللوحة</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="رقم اللوحة *"
            {...register("plateNumber")}
            error={errors.plateNumber?.message}
            placeholder="1234"
            dir="ltr"
          />
          <Input
            label="حروف اللوحة *"
            {...register("plateLetters")}
            error={errors.plateLetters?.message}
            placeholder="أ ب ج"
            dir="rtl"
          />
        </div>

        {/* ── Section: Registration & Legal ── */}
        <p style={sectionHeadingStyle}>الترخيص والتأمين</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="رقم الاستمارة *"
            {...register("registrationNumber")}
            error={errors.registrationNumber?.message}
            placeholder="SA-001234"
            dir="ltr"
          />
          <Input
            label="رقم الهيكل (VIN)"
            {...register("vinNumber")}
            error={errors.vinNumber?.message}
            placeholder="1HGBH41JXMN109186"
            dir="ltr"
          />
          <Input
            label="انتهاء الاستمارة"
            type="date"
            {...register("registrationExpiryDate")}
          />
          <Select label="حالة التأمين" {...register("insuranceStatus")} dir="rtl">
            <option value="Valid">سارٍ</option>
            <option value="Expired">منتهي</option>
            <option value="NotInsured">غير مؤمَّن</option>
          </Select>
          <Input
            label="انتهاء التأمين"
            type="date"
            {...register("insuranceExpiryDate")}
          />
          <Input
            label="انتهاء الفحص الدوري"
            type="date"
            {...register("inspectionExpiryDate")}
          />
        </div>

        {/* ── Section: Operational ── */}
        <p style={sectionHeadingStyle}>بيانات تشغيلية</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <Select label="الفرع" {...register("branchId")} dir="rtl">
            <option value="">اختر الفرع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select label="الحالة" {...register("currentStatus")} dir="rtl">
            <option value="Active">نشط</option>
            <option value="InMaintenance">صيانة</option>
            <option value="InTrip">في رحلة</option>
            <option value="Inactive">غير نشط</option>
          </Select>
          <Input label="رقم GPS" {...register("gpsDeviceId")} placeholder="GPS-001" dir="ltr" />
          <Input
            label="الطاقة الاستيعابية"
            type="number"
            min={0}
            {...numberField("capacity")}
            error={errors.capacity?.message}
            placeholder="0"
            dir="ltr"
          />
          <Input
            label="الوزن (كجم)"
            type="number"
            min={0}
            {...numberField("weight")}
            error={errors.weight?.message}
            placeholder="0"
            dir="ltr"
          />
        </div>
      </form>
    </Modal>
  );
}