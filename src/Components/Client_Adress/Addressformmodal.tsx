"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Spinner } from "../UI";
import {
  createAddressSchema,
  updateAddressSchema,
  type CreateAddressFormValues,
  type UpdateAddressFormValues,
} from "@/src/validations/client_address.validator";
// FIX: was "@/src/types/client" — ClientAddress now lives in the dedicated
// address types file.
import type { ClientAddress } from "@/src/types/client_adresses";

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  input: {
    width: "100%",
    height: 40,
    padding: "0 0.75rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    fontSize: 13,
    color: "var(--color-text-primary)",
    outline: "none",
    fontFamily: "var(--font-sans)",
  } as React.CSSProperties,
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
  } as React.CSSProperties,
  errorText: {
    fontSize: 11,
    color: "var(--color-danger)",
    fontWeight: 500,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--color-text-muted)",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    paddingBottom: "0.25rem",
    borderBottom: "1px solid var(--color-border)",
  } as React.CSSProperties,
};

// FIX 2: Use only the `border` shorthand in both branches — no borderColor/border conflict
const withError = (hasError: boolean): React.CSSProperties => ({
  ...S.input,
  border: hasError
    ? "1px solid var(--color-danger)"
    : "1px solid var(--color-border)",
  background: hasError ? "#FEF2F2" : S.input.background,
});

// ── Props ──────────────────────────────────────────────────────────────────
interface AddressFormModalProps {
  editAddress: ClientAddress | null;
  onClose:     () => void;
  // FIX: removed the "isNew" second argument. The parent (page.tsx) now
  // figures out create-vs-update itself from addrFormTarget, so it no longer
  // needs us to tell it isNew. This avoids the two values (isNew here vs
  // addrFormTarget there) ever disagreeing with each other.
  onSubmit:    (
    data: CreateAddressFormValues | UpdateAddressFormValues
  ) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────────────
export function AddressFormModal({ editAddress, onClose, onSubmit }: AddressFormModalProps) {
  const isNew = editAddress === null;

  // NOTE: "schema" variable removed — resolver now picks createAddressSchema
  // or updateAddressSchema directly inline (see useForm below).

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAddressFormValues | UpdateAddressFormValues>({
    // FIX: "as never" was hiding all type errors on resolver/errors.
    // yupResolver only works with ONE concrete schema type, not a union,
    // so we still need a cast — but cast to the real Resolver type instead
    // of "never", so formState.errors keeps proper typing.
    resolver: (isNew ? yupResolver(createAddressSchema) : yupResolver(updateAddressSchema)) as Resolver<
      CreateAddressFormValues | UpdateAddressFormValues
    >,
    defaultValues: {
      label:      editAddress?.label      ?? "",
      branchName: editAddress?.branchName ?? "",
      isPrimary:  editAddress?.isPrimary  ?? false,

      contactPerson: {
        name:  editAddress?.contactPerson?.name  ?? "",
        phone: editAddress?.contactPerson?.phone ?? "",
      },

      details: {
        country:      editAddress?.details?.country      ?? "SA",
        city:         editAddress?.details?.city         ?? "",
        state:        editAddress?.details?.state        ?? "",
        district:     editAddress?.details?.district     ?? "",
        street:       editAddress?.details?.street       ?? "",
        buildingNo:   editAddress?.details?.buildingNo   ?? "",
        unitNo:       editAddress?.details?.unitNo       ?? "",
        additionalNo: editAddress?.details?.additionalNo ?? "",
        zipCode:      editAddress?.details?.zipCode      ?? "",
        apartment:    editAddress?.details?.apartment    ?? "",
      },

      location: {
        coordinates: editAddress?.location?.coordinates ?? [0, 0],
      },
    },
  });

  const detailsErr  = (errors as never as Record<string, Record<string, { message?: string }>>)?.details      ?? {};
  const contactErr  = (errors as never as Record<string, Record<string, { message?: string }>>)?.contactPerson ?? {};
  const locationErr = (errors as never as Record<string, Record<string, { message?: string }>>)?.location      ?? {};

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const submitHandler = async (data: CreateAddressFormValues | UpdateAddressFormValues) => {
    const ok = await onSubmit(data); // FIX: no more isNew arg, see prop type above
    if (ok) {
      onClose();
    } else {
      setError("label", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="addr-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header — pinned */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#2563EB",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {isNew ? "إضافة عنوان" : "تعديل عنوان"}
            </p>
            <h2
              id="addr-modal-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "4px 0 0",
              }}
            >
              {isNew ? "عنوان جديد" : editAddress?.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              cursor: "pointer",
              fontSize: 18,
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <form
            onSubmit={handleSubmit(submitHandler)}
            noValidate
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {errors.label?.type === "manual" && (
              <Alert type="error" message={errors.label.message ?? ""} onClose={() => {}} />
            )}

            {/* Address Meta */}
            <p style={S.sectionTitle}>بيانات العنوان</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "0.75rem",
                alignItems: "end",
              }}
            >
              <label style={S.label}>
                نوع العنوان
                <input
                  {...register("label")}
                  style={withError(!!errors.label && errors.label.type !== "manual")}
                  placeholder="مقترح: منزل / مكتب"
                  dir="rtl"
                />
                {errors.label && errors.label.type !== "manual" && (
                  <span style={S.errorText}>{errors.label.message}</span>
                )}
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  paddingBottom: 2,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  {...register("isPrimary")}
                  style={{ width: 14, height: 14, cursor: "pointer" }}
                />
                عنوان رئيسي
              </label>
            </div>

            <label style={S.label}>
              اسم الفرع (اختياري)
              <input
                {...register("branchName")}
                style={S.input}
                placeholder="فرع الرياض"
                dir="rtl"
              />
            </label>

            {/* Address Details */}
            <p style={S.sectionTitle}>تفاصيل العنوان</p>

            <label style={S.label}>
              الشارع / العنوان التفصيلي {isNew && "*"}
              <input
                {...register("details.street")}
                style={withError(!!detailsErr.street)}
                placeholder="شارع الملك فهد، مبنى 12"
                dir="rtl"
              />
              {detailsErr.street && (
                <span style={S.errorText}>{detailsErr.street.message}</span>
              )}
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={S.label}>
                المدينة {isNew && "*"}
                <input
                  {...register("details.city")}
                  style={withError(!!detailsErr.city)}
                  placeholder="الرياض"
                  dir="rtl"
                />
                {detailsErr.city && (
                  <span style={S.errorText}>{detailsErr.city.message}</span>
                )}
              </label>

              <label style={S.label}>
                المنطقة
                <input
                  {...register("details.state")}
                  style={withError(!!detailsErr.state)}
                  placeholder="منطقة الرياض"
                  dir="rtl"
                />
                {detailsErr.state && (
                  <span style={S.errorText}>{detailsErr.state.message}</span>
                )}
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={S.label}>
                الحي (اختياري)
                <input
                  {...register("details.district")}
                  style={S.input}
                  placeholder="حي العليا"
                  dir="rtl"
                />
              </label>

              <label style={S.label}>
                رقم المبنى (اختياري)
                <input
                  {...register("details.buildingNo")}
                  style={S.input}
                  placeholder="1234"
                  dir="ltr"
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={S.label}>
                رقم الوحدة (اختياري)
                <input
                  {...register("details.unitNo")}
                  style={S.input}
                  placeholder="5678"
                  dir="ltr"
                />
              </label>

              <label style={S.label}>
                الرقم الإضافي (اختياري)
                <input
                  {...register("details.additionalNo")}
                  style={S.input}
                  placeholder="0000"
                  dir="ltr"
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={S.label}>
                الرمز البريدي (اختياري)
                <input
                  {...register("details.zipCode")}
                  style={withError(!!detailsErr.zipCode)}
                  placeholder="11564"
                  dir="ltr"
                />
                {detailsErr.zipCode && (
                  <span style={S.errorText}>{detailsErr.zipCode.message}</span>
                )}
              </label>

              <label style={S.label}>
                الدولة
                <input
                  {...register("details.country")}
                  style={withError(!!detailsErr.country)}
                  placeholder="SA"
                  dir="ltr"
                />
                {detailsErr.country && (
                  <span style={S.errorText}>{detailsErr.country.message}</span>
                )}
              </label>
            </div>

            <label style={S.label}>
              الشقة / الطابق (اختياري)
              <input
                {...register("details.apartment")}
                style={S.input}
                placeholder="الطابق الثالث"
                dir="rtl"
              />
            </label>

            {/* Contact Person */}
            <p style={S.sectionTitle}>جهة الاتصال (اختياري)</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={S.label}>
                الاسم
                <input
                  {...register("contactPerson.name")}
                  style={withError(!!contactErr.name)}
                  placeholder="أحمد محمد"
                  dir="rtl"
                />
                {contactErr.name && (
                  <span style={S.errorText}>{contactErr.name.message}</span>
                )}
              </label>

              <label style={S.label}>
                رقم الهاتف
                <input
                  {...register("contactPerson.phone")}
                  style={withError(!!contactErr.phone)}
                  type="tel"
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                />
                {contactErr.phone && (
                  <span style={S.errorText}>{contactErr.phone.message}</span>
                )}
              </label>
            </div>

            {/* Coordinates */}
            <p style={S.sectionTitle}>الإحداثيات الجغرافية {isNew && "*"}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={S.label}>
                خط الطول (Longitude) {isNew && "*"}
                <input
                  {...register("location.coordinates.0" as never)}
                  style={withError(!!locationErr.coordinates)}
                  type="number"
                  step="any"
                  placeholder="46.6753"
                  dir="ltr"
                />
              </label>

              <label style={S.label}>
                خط العرض (Latitude) {isNew && "*"}
                <input
                  {...register("location.coordinates.1" as never)}
                  style={withError(!!locationErr.coordinates)}
                  type="number"
                  step="any"
                  placeholder="24.7136"
                  dir="ltr"
                />
                {locationErr.coordinates && (
                  <span style={S.errorText}>{locationErr.coordinates.message}</span>
                )}
              </label>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
                paddingTop: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  height: 40,
                  padding: "0 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: 40,
                  padding: "0 1.5rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: isSubmitting
                    ? "var(--color-brand-400)"
                    : "var(--color-brand-600)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFF",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {isSubmitting && <Spinner size="sm" className="text-white" />}
                {isSubmitting ? "جارٍ الحفظ…" : isNew ? "إضافة العنوان" : "حفظ التغييرات"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}