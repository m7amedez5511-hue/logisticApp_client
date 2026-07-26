"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal } from "../UI";
import { createBranchSchema, updateBranchSchema } from "@/src/validations/branch.validator";
import type { Branch, BranchFormData } from "@/src/types/branch";

const FORM_ID = "branch-form";

// ── Props ─────────────────────────────────────────────────────────────────────
interface BranchFormModalProps {
  editBranch: Branch | null;
  onClose:    () => void;
  onSubmit:   (data: BranchFormData, isNew: boolean) => Promise<boolean>;
}

// ── main component ────────────────────────────────────────────────────────────
export function BranchFormModal({ editBranch, onClose, onSubmit }: BranchFormModalProps) {
  const isNew = editBranch === null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    // Cast the schema itself and pin the generic explicitly on yupResolver —
    // create/update schemas differ structurally in which fields are required
    // (e.g. city/street are optional on update), so yup can't unify them
    // into the single flat BranchFormData shape on its own.
    resolver: yupResolver<BranchFormData>((isNew ? createBranchSchema : updateBranchSchema) as any),
    defaultValues: {
      name:       editBranch?.name       ?? "",
      email:      editBranch?.email      ?? "",
      phone:      editBranch?.phone      ?? "",
      country:    editBranch?.country    ?? "SA",
      city:       editBranch?.city       ?? "",
      state:      editBranch?.state      ?? "",
      district:   editBranch?.district   ?? "",
      street:     editBranch?.street     ?? "",
      buildingNo: editBranch?.buildingNo ?? "",
      unitNo:     editBranch?.unitNo     ?? "",
      zipCode:    editBranch?.zipCode    ?? "",
      latitude:   editBranch?.latitude   != null ? String(editBranch.latitude)  : "",
      longitude:  editBranch?.longitude  != null ? String(editBranch.longitude) : "",
    },
  });

  const submitHandler = async (data: BranchFormData) => {
    const ok = await onSubmit(data, isNew);
    if (ok) {
      onClose();
    } else {
      setError("name", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    }
  };

  return (
    <Modal
      open
      title={isNew ? "فرع جديد" : editBranch?.name ?? ""}
      subtitle={isNew ? "إضافة فرع" : "تعديل فرع"}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {isNew ? "إضافة الفرع" : "حفظ التغييرات"}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(submitHandler)}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {errors.name?.type === "manual" && (
          <Alert type="error" message={errors.name.message ?? ""} onClose={() => {}} />
        )}

        {/* name */}
        <Input
          label="اسم الفرع *"
          {...register("name")}
          error={errors.name && errors.name.type !== "manual" ? errors.name.message : undefined}
          placeholder="فرع الرياض"
          autoComplete="organization"
          autoFocus
          dir="rtl"
        />

        {/* email + phone */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="البريد الإلكتروني"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            placeholder="branch@co.sa"
            autoComplete="email"
            dir="ltr"
          />
          <Input
            label="رقم الهاتف"
            type="tel"
            {...register("phone")}
            error={errors.phone?.message}
            placeholder="+966 5x xxx xxxx"
            autoComplete="tel"
            dir="ltr"
          />
        </div>

        {/* city + street */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="المدينة *"
            {...register("city")}
            error={errors.city?.message}
            placeholder="الرياض"
            dir="rtl"
          />
          <Input
            label="الشارع *"
            {...register("street")}
            error={errors.street?.message}
            placeholder="شارع الملك فهد"
            dir="rtl"
          />
        </div>

        {/* state + district */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="المنطقة"
            {...register("state")}
            error={errors.state?.message}
            placeholder="منطقة الرياض"
            dir="rtl"
          />
          <Input
            label="الحي"
            {...register("district")}
            error={errors.district?.message}
            placeholder="حي العليا"
            dir="rtl"
          />
        </div>

        {/* buildingNo + unitNo + zipCode */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="رقم المبنى"
            {...register("buildingNo")}
            error={errors.buildingNo?.message}
            placeholder="1234"
            dir="ltr"
          />
          <Input
            label="رقم الوحدة"
            {...register("unitNo")}
            error={errors.unitNo?.message}
            placeholder="5"
            dir="ltr"
          />
          <Input
            label="الرمز البريدي"
            {...register("zipCode")}
            error={errors.zipCode?.message}
            placeholder="12345"
            dir="ltr"
          />
        </div>

        {/* country */}
        <Input
          label="الدولة"
          {...register("country")}
          error={errors.country?.message}
          placeholder="SA"
          dir="ltr"
        />

        {/* latitude + longitude */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="خط العرض (اختياري)"
            {...register("latitude")}
            error={errors.latitude?.message}
            placeholder="24.7136"
            dir="ltr"
            inputMode="decimal"
          />
          <Input
            label="خط الطول (اختياري)"
            {...register("longitude")}
            error={errors.longitude?.message}
            placeholder="46.6753"
            dir="ltr"
            inputMode="decimal"
          />
        </div>
      </form>
    </Modal>
  );
}