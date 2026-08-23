"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, FileInput, Input, Modal, Select } from "../UI";
import { get } from "@/src/services/api";
import { getStoredToken } from "@/src/lib/auth";
import {
  createDriverSchema,
  updateDriverSchema,
} from "@/src/validations/driver.validator";
import { useEditFormSync } from "@/src/hooks/useEditFormSync";
import type {
  Driver,
  CreateDriverPayload,
  UpdateDriverPayload,
  NationalIdType,
  DriverCardType,
  DriverStatus,
} from "@/src/types/driver";
import type { Branch } from "@/src/types/branch";

// ── Shared bits ──────────────────────────────────────────────────────────────

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "var(--color-text-hint)",
  fontWeight: 700,
  margin: "0.5rem 0 0",
};

const FORM_ID = "driver-form";

// ── Date helper ──────────────────────────────────────────────────────────────

function toIsoDateTime(val: string): string {
  if (!val) return val;
  if (val.includes("T")) return val;
  return `${val}T00:00:00.000Z`;
}

// ── Form values shape ────────────────────────────────────────────────────────

interface DriverFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  nationality: string;
  nationalIdType: NationalIdType | "";
  nationalId: string;
  nationalIdExpiry: string;
  gosiNumber: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  driverCardNumber: string;
  driverCardType: DriverCardType | "";
  driverCardExpiry: string;
  driverType: string;
  branchId: string;
  status: DriverStatus;
  photo: File | null;
  nationalPhoto: File | null;
  driverCardPhoto: File | null;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface DriverFormModalProps {
  editDriver: Driver | null;
  branches: Branch[];
  onClose: () => void;
  onSubmit: (
    payload: CreateDriverPayload | UpdateDriverPayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DriverFormModal({
  editDriver,
  branches: branchesProp,
  onClose,
  onSubmit,
}: DriverFormModalProps) {
  const isNew = editDriver === null;

  // ── react-hook-form ────────────────────────────────────────────────────────
  // Moved above the branches-loading effect below: that effect calls
  // setValue(), so useForm() (which defines it) must run first — otherwise
  // setValue is referenced before its own initialization (TDZ ReferenceError),
  // same issue already fixed in TripFormModal.
  const {
    register,
    handleSubmit,
    control,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormValues>({
    // Cast both the schema argument and the resolver's result — same fix
    // already applied in TripFormModal: createDriverSchema/updateDriverSchema
    // have structurally different required fields (union type yupResolver's
    // single-schema signature won't accept), and yup's inferred type for
    // .optional() fields is structurally incompatible with DriverFormValues.
    resolver: yupResolver(
      (isNew ? createDriverSchema : updateDriverSchema) as any,
    ) as any,
    defaultValues: {
      name: editDriver?.name ?? "",
      phone: editDriver?.phone ?? "",
      email: editDriver?.email ?? "",
      address: editDriver?.address ?? "",
      nationality: editDriver?.nationality ?? "",
      nationalIdType: editDriver?.nationalIdType ?? "",
      nationalId:
        (editDriver as Driver & { nationalId?: string })?.nationalId ?? "",
      nationalIdExpiry:
        (
          editDriver as Driver & { nationalIdExpiry?: string }
        )?.nationalIdExpiry?.slice(0, 10) ?? "",
      gosiNumber: editDriver?.gosiNumber ?? "",
      licenseNumber: editDriver?.licenseNumber ?? "",
      licenseType: editDriver?.licenseType ?? "",
      licenseExpiry: editDriver?.licenseExpiry?.slice(0, 10) ?? "",
      driverCardNumber: editDriver?.driverCardNumber ?? "",
      driverCardType: editDriver?.driverCardType ?? "",
      driverCardExpiry: editDriver?.driverCardExpiry?.slice(0, 10) ?? "",
      driverType: editDriver?.driverType ?? "",
      branchId: (editDriver as Driver & { branchId?: string })?.branchId ?? "",
      status: editDriver?.status ?? "Active",
      photo: null,
      nationalPhoto: null,
      driverCardPhoto: null,
    },
  });

  // ── Local branches (auto-fetched if prop is empty) ─────────────────────────
  const [branches, setBranches] = useState<Branch[]>(branchesProp);
  useEffect(() => {
    if (branchesProp.length > 0) {
      queueMicrotask(() => setBranches(branchesProp));
      return;
    }
    const token = getStoredToken();
    get<{ data: { data: Branch[] } }>("branches?limit=100", token)
      .then((res) => {
        const list =
          (res as unknown as { data: { data: Branch[] } }).data?.data ?? [];
        setBranches(list);
      })
      .catch(() => {
        /* silently ignore */
      });
  }, [branchesProp]);

  // CHANGE: replaced the manual `if (savedBranchId) setValue("branchId", ...)`
  // calls above with useEditFormSync — same fix, shared implementation.
  useEditFormSync(
    setValue,
    "branchId",
    (editDriver as Driver & { branchId?: string })?.branchId,
    branches,
  );

  const [apiError, setApiError] = useState("");

  // register("name") already attaches its own ref — focusing via setFocus
  // avoids the ref collision that a separate `ref={firstRef}` would cause.
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const submitHandler = useCallback(
    async (data: DriverFormValues) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        phone: data.phone,
      };
      if (data.email) payload.email = data.email;
      if (data.address) payload.address = data.address;
      if (data.nationality) payload.nationality = data.nationality;
      if (data.nationalIdType) payload.nationalIdType = data.nationalIdType;
      if (data.nationalId) payload.nationalId = data.nationalId;
      if (data.nationalIdExpiry)
        payload.nationalIdExpiry = toIsoDateTime(data.nationalIdExpiry);
      if (data.gosiNumber) payload.gosiNumber = data.gosiNumber;
      if (data.licenseNumber) payload.licenseNumber = data.licenseNumber;
      if (data.licenseType) payload.licenseType = data.licenseType;
      if (data.licenseExpiry)
        payload.licenseExpiry = toIsoDateTime(data.licenseExpiry);
      if (data.driverCardNumber)
        payload.driverCardNumber = data.driverCardNumber;
      if (data.driverCardType) payload.driverCardType = data.driverCardType;
      if (data.driverCardExpiry)
        payload.driverCardExpiry = toIsoDateTime(data.driverCardExpiry);
      if (data.driverType) payload.driverType = data.driverType;
      if (data.branchId) payload.branchId = data.branchId;
      if (!isNew) payload.status = data.status;
      // File fields are excluded from the JSON diff unless actually chosen —
      // matches the pre-refactor behavior exactly.
      if (data.photo) payload.photo = data.photo;
      if (data.nationalPhoto) payload.nationalPhoto = data.nationalPhoto;
      if (data.driverCardPhoto) payload.driverCardPhoto = data.driverCardPhoto;

      setApiError("");
      try {
        const ok = await onSubmit(
          payload as unknown as CreateDriverPayload,
          isNew,
        );
        if (ok) {
          onClose();
        } else {
          setError("name", {
            message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.",
          });
          setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
        setError("name", { message });
        setApiError(message);
      }
    },
    [isNew, onSubmit, onClose, setError],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      subtitle={isNew ? "إضافة سائق" : "تعديل سائق"}
      title={isNew ? "سائق جديد" : (editDriver?.name ?? "")}
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {isNew ? "إضافة السائق" : "حفظ التغييرات"}
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
        {errors.name?.type === "manual" && (
          <Alert
            type="error"
            message={errors.name.message ?? ""}
            onClose={() => setApiError("")}
          />
        )}

        {/* ── Section: Personal Info ── */}
        <p style={sectionHeadingStyle}>البيانات الشخصية</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="الاسم الكامل *"
            placeholder="محمد عبدالله"
            dir="rtl"
            autoComplete="off"
            error={
              errors.name?.type !== "manual" ? errors.name?.message : undefined
            }
            {...register("name")}
          />

          <Input
            label="رقم الجوال *"
            placeholder="05XXXXXXXX"
            dir="ltr"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <Input
            label="البريد الإلكتروني (اختياري)"
            type="email"
            placeholder="example@mail.com"
            dir="ltr"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="الجنسية (اختياري)"
            placeholder="سعودي"
            dir="rtl"
            error={errors.nationality?.message}
            {...register("nationality")}
          />

          <Input
            className="sm:col-span-2"
            label="العنوان (اختياري)"
            placeholder="الرياض، حي..."
            dir="rtl"
            error={errors.address?.message}
            {...register("address")}
          />
        </div>

        {/* ── Section: ID & GOSI ── */}
        <p style={sectionHeadingStyle}>الهوية والتأمينات</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="نوع الهوية (اختياري)"
            dir="rtl"
            error={errors.nationalIdType?.message}
            {...register("nationalIdType")}
          >
            <option value="">اختر النوع</option>
            <option value="NationalID">هوية وطنية</option>
            <option value="Iqama">إقامة</option>
            <option value="Passport">جواز سفر</option>
          </Select>

          <Input
            label="رقم الهوية (اختياري)"
            placeholder="1XXXXXXXXX"
            dir="ltr"
            error={errors.nationalId?.message}
            {...register("nationalId")}
          />

          <Input
            label="انتهاء الهوية (اختياري)"
            type="date"
            error={errors.nationalIdExpiry?.message}
            {...register("nationalIdExpiry")}
          />

          <Input
            label="رقم GOSI (اختياري)"
            placeholder="GOSI-XXXX"
            dir="ltr"
            error={errors.gosiNumber?.message}
            {...register("gosiNumber")}
          />
        </div>

        {/* ── Section: License ── */}
        <p style={sectionHeadingStyle}>رخصة القيادة</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="رقم الرخصة (اختياري)"
            placeholder="LIC-XXXX"
            dir="ltr"
            error={errors.licenseNumber?.message}
            {...register("licenseNumber")}
          />

          <Input
            label="نوع الرخصة (اختياري)"
            placeholder="خاص / عام"
            dir="rtl"
            error={errors.licenseType?.message}
            {...register("licenseType")}
          />

          <Input
            label="انتهاء الرخصة (اختياري)"
            type="date"
            error={errors.licenseExpiry?.message}
            {...register("licenseExpiry")}
          />
        </div>

        {/* ── Section: Driver Card ── */}
        <p style={sectionHeadingStyle}>بطاقة السائق</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="رقم البطاقة (اختياري)"
            placeholder="CARD-XXXX"
            dir="ltr"
            error={errors.driverCardNumber?.message}
            {...register("driverCardNumber")}
          />

          <Select
            label="نوع البطاقة (اختياري)"
            dir="rtl"
            error={errors.driverCardType?.message}
            {...register("driverCardType")}
          >
            <option value="">اختر النوع</option>
            <option value="Temporary">مؤقتة</option>
            <option value="Seasonal">موسمية</option>
            <option value="Annual">سنوية</option>
            <option value="Restricted">مقيدة</option>
          </Select>

          <Input
            label="انتهاء البطاقة (اختياري)"
            type="date"
            error={errors.driverCardExpiry?.message}
            {...register("driverCardExpiry")}
          />
        </div>

        {/* ── Section: Operational ── */}
        <p style={sectionHeadingStyle}>بيانات تشغيلية</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="الفرع (اختياري)"
            dir="rtl"
            error={errors.branchId?.message}
            {...register("branchId")}
          >
            <option value="">اختر الفرع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Input
            label="نوع السائق (اختياري)"
            placeholder="رئيسي / احتياطي"
            dir="rtl"
            error={errors.driverType?.message}
            {...register("driverType")}
          />

          {/* Status — edit only */}
          {!isNew && (
            <Select label="الحالة" dir="rtl" {...register("status")}>
              <option value="Active">نشط</option>
              <option value="InTrip">في رحلة</option>
              <option value="Inactive">غير نشط</option>
              <option value="Suspended">موقوف</option>
            </Select>
          )}
        </div>

        {/* ── Section: Photos ── */}
        <p style={sectionHeadingStyle}>الصور والمستندات</p>
        <p
          style={{
            fontSize: 11,
            color: "var(--color-text-hint)",
            margin: "0.25rem 0 0",
            fontWeight: 400,
          }}
        >
          جميع حقول الصور اختيارية
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* File inputs cannot use register() directly — bind via Controller
              to the existing FileInput component's current/onChange props. */}
          <Controller
            name="photo"
            control={control}
            render={({ field }) => (
              <FileInput
                label="صورة السائق"
                current={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="nationalPhoto"
            control={control}
            render={({ field }) => (
              <FileInput
                label="صورة الهوية"
                current={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="driverCardPhoto"
            control={control}
            render={({ field }) => (
              <FileInput
                label="صورة البطاقة"
                current={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
