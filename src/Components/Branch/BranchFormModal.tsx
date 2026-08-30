"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal, Select } from "../UI";
import { createBranchSchema, updateBranchSchema } from "@/src/validations/branch.validator";
import {
  getRegions,
  getCitiesByRegion,
  getDistrictsByCity,
  resolveLocation,
  findLocationByNames,
} from "@/src/lib/locationHierarchy";
import type { Branch, BranchFormData } from "@/src/types/branch";

const FORM_ID = "branch-form";

// Step 1: Extend the plain form-values shape with the three hierarchy ids.
// BranchFormData itself stays untouched (see src/types/branch.ts) — city/
// state/district there are still plain strings, since that's the API
// contract. This local type is what react-hook-form actually manages.
interface BranchFormValues extends BranchFormData {
  regionId: string;
  cityId: string;
  districtId: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface BranchFormModalProps {
  editBranch: Branch | null;
  onClose: () => void;
  onSubmit: (data: BranchFormData, isNew: boolean) => Promise<boolean>;
}

// ── main component ────────────────────────────────────────────────────────────
export function BranchFormModal({ editBranch, onClose, onSubmit }: BranchFormModalProps) {
  const isNew = editBranch === null;

  // Step 2: On edit, try to resolve the branch's stored city/state/district
  // NAMES back into ids against the current dataset. If nothing matches
  // (the value is a legacy/unknown location no longer in the hierarchy),
  // resolved stays null and the form falls back to empty selects — the
  // person must actively re-pick a valid Region -> City -> District chain
  // before they can save, rather than silently keeping a stale value.
  const resolvedEdit = useMemo(
    () => (editBranch ? findLocationByNames(editBranch.state, editBranch.city, editBranch.district) : null),
    [editBranch],
  );
  const isLegacyLocation = !isNew && !resolvedEdit && !!(editBranch?.city || editBranch?.district);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: yupResolver<BranchFormValues>((isNew ? createBranchSchema : updateBranchSchema) as any),
    defaultValues: {
      name: editBranch?.name ?? "",
      email: editBranch?.email ?? "",
      phone: editBranch?.phone ?? "",
      country: editBranch?.country ?? "SA",
      regionId: resolvedEdit?.regionId ?? "",
      cityId: resolvedEdit?.cityId ?? "",
      districtId: resolvedEdit?.districtId ?? "",
      city: editBranch?.city ?? "",
      state: editBranch?.state ?? "",
      district: editBranch?.district ?? "",
      street: editBranch?.street ?? "",
      buildingNo: editBranch?.buildingNo ?? "",
      unitNo: editBranch?.unitNo ?? "",
      zipCode: editBranch?.zipCode ?? "",
      latitude: resolvedEdit?.latitude != null ? String(resolvedEdit.latitude) : editBranch?.latitude != null ? String(editBranch.latitude) : "",
      longitude: resolvedEdit?.longitude != null ? String(resolvedEdit.longitude) : editBranch?.longitude != null ? String(editBranch.longitude) : "",
    },
  });

  // Step 3: Watch the two parent selects so the child dropdowns can filter
  // themselves reactively (cascading Region -> City -> District).
  const watchedRegionId = watch("regionId");
  const watchedCityId = watch("cityId");
  const watchedDistrictId = watch("districtId");

  const regions = useMemo(() => getRegions(), []);
  const cities = useMemo(() => getCitiesByRegion(watchedRegionId), [watchedRegionId]);
  const districts = useMemo(
    () => getDistrictsByCity(watchedRegionId, watchedCityId),
    [watchedRegionId, watchedCityId],
  );

  // Step 4: Whenever the region changes, clear any city/district selection
  // that no longer belongs to it — prevents the exact "Mohandessin under
  // Cairo" class of bug from ever reaching submit.
  useEffect(() => {
    if (!watchedCityId) return;
    const stillValid = cities.some((c) => c.id === watchedCityId);
    if (!stillValid) {
      setValue("cityId", "");
      setValue("districtId", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedRegionId]);

  useEffect(() => {
    if (!watchedDistrictId) return;
    const stillValid = districts.some((d) => d.id === watchedDistrictId);
    if (!stillValid) setValue("districtId", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCityId]);

  // Step 5: Whenever the fully-resolved district changes, auto-populate
  // latitude/longitude from the dataset — no manual coordinate entry.
  useEffect(() => {
    const resolved = resolveLocation(watchedRegionId, watchedCityId, watchedDistrictId);
    if (resolved) {
      setValue("latitude", String(resolved.latitude));
      setValue("longitude", String(resolved.longitude));
    }
  }, [watchedRegionId, watchedCityId, watchedDistrictId, setValue]);

  const submitHandler = async (data: BranchFormValues) => {
    // Step 6: Resolve the chosen ids into display names right before
    // building the payload, so the API keeps receiving plain strings for
    // city/state/district exactly as it does today — this UI change is
    // fully transparent to the backend contract.
    const resolved = resolveLocation(data.regionId, data.cityId, data.districtId);

    const payload: BranchFormData = {
      ...data,
      state: resolved?.regionName ?? data.state,
      city: resolved?.cityName ?? data.city,
      district: resolved?.districtName ?? data.district,
      latitude: resolved ? String(resolved.latitude) : data.latitude,
      longitude: resolved ? String(resolved.longitude) : data.longitude,
    };

    const ok = await onSubmit(payload, isNew);
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

        {/* Step 7: Warn once if the stored location no longer matches any
            valid Region -> City -> District chain, and require a fresh
            selection instead of silently keeping the legacy value. */}
        {isLegacyLocation && (
          <Alert
            type="warning"
            message="الموقع المحفوظ لهذا الفرع لم يعد مطابقًا لأي منطقة/مدينة/حي معروف. الرجاء اختيار الموقع الصحيح من القوائم أدناه."
            onClose={() => {}}
          />
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

        {/* Step 8: Cascading Region -> City -> District selects. Each
            child <Select> is disabled until its parent has a value, and
            its options come straight from the resolved parent id — a
            district literally cannot be picked unless it belongs to the
            currently-selected city. */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Controller
            name="regionId"
            control={control}
            render={({ field }) => (
              <Select
                label="المنطقة *"
                value={field.value}
                onChange={field.onChange}
                error={(errors as any).regionId?.message}
                dir="rtl"
              >
                <option value="">اختر المنطقة</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            )}
          />

          <Controller
            name="cityId"
            control={control}
            render={({ field }) => (
              <Select
                label="المدينة *"
                value={field.value}
                onChange={field.onChange}
                error={(errors as any).cityId?.message}
                disabled={!watchedRegionId}
                dir="rtl"
              >
                <option value="">{watchedRegionId ? "اختر المدينة" : "اختر المنطقة أولاً"}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Controller
            name="districtId"
            control={control}
            render={({ field }) => (
              <Select
                label="الحي *"
                value={field.value}
                onChange={field.onChange}
                error={(errors as any).districtId?.message}
                disabled={!watchedCityId}
                dir="rtl"
              >
                <option value="">{watchedCityId ? "اختر الحي" : "اختر المدينة أولاً"}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            )}
          />

          <Input
            label="الشارع *"
            {...register("street")}
            error={errors.street?.message}
            placeholder="شارع الملك فهد"
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
          disabled
        />

        {/* Step 9: latitude/longitude are now READ-ONLY — they are derived
            automatically from the selected district (Step 5 above), so
            there is no manual entry and therefore no coordinate-vs-district
            mismatch possible from this form. */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="خط العرض (تلقائي)"
            {...register("latitude")}
            error={errors.latitude?.message}
            placeholder="—"
            dir="ltr"
            inputMode="decimal"
            readOnly
            disabled
          />
          <Input
            label="خط الطول (تلقائي)"
            {...register("longitude")}
            error={errors.longitude?.message}
            placeholder="—"
            dir="ltr"
            inputMode="decimal"
            readOnly
            disabled
          />
        </div>
      </form>
    </Modal>
  );
}