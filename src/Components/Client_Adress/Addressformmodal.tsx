"use client";

import { useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input, Modal } from "../UI";
import {
  createAddressSchema,
  updateAddressSchema,
  type CreateAddressFormValues,
  type UpdateAddressFormValues,
} from "@/src/validations/client_address.validator";
import type { ClientAddress } from "@/src/types/client_adresses";

// ── Styles ─────────────────────────────────────────────────────────────────
// Only section-title styling is left here — every input/label/error visual
// is now owned by the shared <Input /> component.
const S = {
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

const FORM_ID = "address-form";

// ── Props ──────────────────────────────────────────────────────────────────
interface AddressFormModalProps {
  editAddress: ClientAddress | null;
  onClose:     () => void;
  onSubmit:    (data: CreateAddressFormValues | UpdateAddressFormValues) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────────────
export function AddressFormModal({ editAddress, onClose, onSubmit }: AddressFormModalProps) {
  const isNew = editAddress === null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAddressFormValues | UpdateAddressFormValues>({
    resolver: (isNew
      ? yupResolver(createAddressSchema)
      : yupResolver(updateAddressSchema)
    ) as Resolver<CreateAddressFormValues | UpdateAddressFormValues>,

    defaultValues: {
      label:      editAddress?.label      ?? "",
      branchName: editAddress?.branchName ?? "",

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

  type AddressFieldError = {
    message?: string;
  };

  type AddressErrors = {
    details?: {
      street?: AddressFieldError;
      city?: AddressFieldError;
      state?: AddressFieldError;
      district?: AddressFieldError;
      buildingNo?: AddressFieldError;
      unitNo?: AddressFieldError;
      additionalNo?: AddressFieldError;
      zipCode?: AddressFieldError;
      country?: AddressFieldError;
      apartment?: AddressFieldError;
    };
    contactPerson?: {
      name?: AddressFieldError;
      phone?: AddressFieldError;
    };
    location?: {
      coordinates?: AddressFieldError;
    };
  };

  const {
    details: detailsErr = {},
    contactPerson: contactErr = {},
    location: locationErr = {},
  } = errors as AddressErrors;

  const submitHandler = async (data: CreateAddressFormValues | UpdateAddressFormValues) => {
    const ok = await onSubmit(data);
    if (ok) {
      onClose();
    } else {
      setError("label", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    }
  };

  return (
    <Modal
      open
      title={isNew ? "عنوان جديد" : editAddress?.label ?? ""}
      subtitle={isNew ? "إضافة عنوان" : "تعديل عنوان"}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting}>
            {isNew ? "إضافة العنوان" : "حفظ التغييرات"}
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
        {errors.label?.type === "manual" && (
          <Alert type="error" message={errors.label.message ?? ""} onClose={() => {}} />
        )}

        {/* Address Meta */}
        <p style={S.sectionTitle}>بيانات العنوان</p>

        <Input
          label={`نوع العنوان${isNew ? " *" : ""}`}
          {...register("label")}
          error={errors.label && errors.label.type !== "manual" ? errors.label.message : undefined}
          placeholder="مثال: منزل / مكتب / شحن"
          dir="rtl"
        />

        <Input
          label="اسم الفرع (اختياري)"
          {...register("branchName")}
          placeholder="فرع الرياض"
          dir="rtl"
        />

        {/* Address Details */}
        <p style={S.sectionTitle}>تفاصيل العنوان</p>

        <Input
          label={`الشارع / العنوان التفصيلي${isNew ? " *" : ""}`}
          {...register("details.street")}
          error={detailsErr.street?.message}
          placeholder="شارع الملك فهد، مبنى 12"
          dir="rtl"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label={`المدينة${isNew ? " *" : ""}`}
            {...register("details.city")}
            error={detailsErr.city?.message}
            placeholder="الرياض"
            dir="rtl"
          />
          <Input
            label="المنطقة"
            {...register("details.state")}
            error={detailsErr.state?.message}
            placeholder="منطقة الرياض"
            dir="rtl"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="الحي (اختياري)"
            {...register("details.district")}
            placeholder="حي العليا"
            dir="rtl"
          />
          <Input
            label="رقم المبنى (اختياري)"
            {...register("details.buildingNo")}
            placeholder="1234"
            dir="ltr"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="رقم الوحدة (اختياري)"
            {...register("details.unitNo")}
            placeholder="5678"
            dir="ltr"
          />
          <Input
            label="الرقم الإضافي (اختياري)"
            {...register("details.additionalNo")}
            placeholder="0000"
            dir="ltr"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="الرمز البريدي (اختياري)"
            {...register("details.zipCode")}
            error={detailsErr.zipCode?.message}
            placeholder="11564"
            dir="ltr"
          />
          <Input
            label="الدولة"
            {...register("details.country")}
            error={detailsErr.country?.message}
            placeholder="SA"
            dir="ltr"
          />
        </div>

        <Input
          label="الشقة / الطابق (اختياري)"
          {...register("details.apartment")}
          placeholder="الطابق الثالث"
          dir="rtl"
        />

        {/* Contact Person */}
        <p style={S.sectionTitle}>جهة الاتصال (اختياري)</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label="الاسم"
            {...register("contactPerson.name")}
            error={contactErr.name?.message}
            placeholder="أحمد محمد"
            dir="rtl"
          />
          <Input
            label="رقم الهاتف"
            {...register("contactPerson.phone")}
            error={contactErr.phone?.message}
            type="tel"
            placeholder="05xxxxxxxx"
            dir="ltr"
          />
        </div>

        {/* Coordinates */}
        <p style={S.sectionTitle}>الإحداثيات الجغرافية{isNew ? " *" : ""}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Input
            label={`خط الطول (Longitude)${isNew ? " *" : ""}`}
            {...register("location.coordinates.0" as never)}
            error={locationErr.coordinates?.message}
            type="number"
            step="any"
            placeholder="46.6753"
            dir="ltr"
          />
          <Input
            label={`خط العرض (Latitude)${isNew ? " *" : ""}`}
            {...register("location.coordinates.1" as never)}
            error={locationErr.coordinates?.message}
            type="number"
            step="any"
            placeholder="24.7136"
            dir="ltr"
          />
        </div>
      </form>
    </Modal>
  );
}