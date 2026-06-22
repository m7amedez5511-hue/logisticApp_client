"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Spinner } from "../UI";
import type {
  ClientAddress,
  ClientAddressFormData,
  ClientAddressFormErrors,
} from "@/src/types/client";

// ── Fixed styles ───────────────────────────────────────────────────────────
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
};

// ── Validation ─────────────────────────────────────────────────────────────
function validate(data: ClientAddressFormData): ClientAddressFormErrors {
  const e: ClientAddressFormErrors = {};
  if (!data.label.trim())      e.label      = "النوع مطلوب";
  if (!data.street.trim())     e.street     = "العنوان مطلوب";
  if (!data.city.trim())       e.city       = "المدينة مطلوبة";
  if (!data.state.trim())      e.state      = "المنطقة مطلوبة";
  if (!data.postalCode.trim()) e.postalCode = "الرمز البريدي مطلوب";
  if (!data.country.trim())    e.country    = "الدولة مطلوبة";
  return e;
}

const LABEL_PRESETS = ["فوترة", "شحن", "المقر الرئيسي", "فرع", "مستودع", "أخرى"];

// ── Props ──────────────────────────────────────────────────────────────────
interface AddressFormModalProps {
  editAddress: ClientAddress | null; // null = create mode
  onClose:     () => void;
  onSubmit:    (data: ClientAddressFormData, isNew: boolean) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────────────
export function AddressFormModal({
  editAddress,
  onClose,
  onSubmit,
}: AddressFormModalProps) {
  const isNew = editAddress === null;

  const [form, setForm] = useState<ClientAddressFormData>({
    label:      editAddress?.label      ?? "",
    street:     editAddress?.street     ?? "",
    city:       editAddress?.city       ?? "",
    state:      editAddress?.state      ?? "",
    postalCode: editAddress?.postalCode ?? "",
    country:    editAddress?.country    ?? "المملكة العربية السعودية",
    isPrimary:  editAddress?.isPrimary  ?? false,
  });
  const [errors,   setErrors]   = useState<ClientAddressFormErrors>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");
  const firstRef               = useRef<HTMLSelectElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (field: keyof ClientAddressFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      if (errors[field as keyof ClientAddressFormErrors])
        setErrors((p) => ({ ...p, [field]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiError("");
    const ok = await onSubmit(form, isNew);
    setSaving(false);
    if (ok) onClose();
    else setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
  };

  const inputStyle = (field: keyof ClientAddressFormErrors): React.CSSProperties => ({
    ...S.input,
    ...(errors[field] ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
  });

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
          maxWidth: 520,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
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

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {apiError && (
            <Alert type="error" message={apiError} onClose={() => setApiError("")} />
          )}

          {/* Label + isPrimary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "0.75rem",
              alignItems: "end",
            }}
          >
            <label style={S.label}>
              نوع العنوان *
              <select
                ref={firstRef}
                style={{ ...inputStyle("label"), cursor: "pointer" }}
                value={form.label}
                onChange={set("label")}
                dir="rtl"
              >
                <option value="">اختر النوع</option>
                {LABEL_PRESETS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.label && <span style={S.errorText}>{errors.label}</span>}
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
                checked={form.isPrimary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isPrimary: e.target.checked }))
                }
                style={{ width: 14, height: 14, cursor: "pointer" }}
              />
              عنوان رئيسي
            </label>
          </div>

          {/* Street */}
          <label style={S.label}>
            الشارع / العنوان التفصيلي *
            <input
              style={inputStyle("street")}
              value={form.street}
              onChange={set("street")}
              placeholder="شارع الملك فهد، مبنى 12"
              dir="rtl"
            />
            {errors.street && <span style={S.errorText}>{errors.street}</span>}
          </label>

          {/* City + State */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              المدينة *
              <input
                style={inputStyle("city")}
                value={form.city}
                onChange={set("city")}
                placeholder="الرياض"
                dir="rtl"
              />
              {errors.city && <span style={S.errorText}>{errors.city}</span>}
            </label>
            <label style={S.label}>
              المنطقة *
              <input
                style={inputStyle("state")}
                value={form.state}
                onChange={set("state")}
                placeholder="منطقة الرياض"
                dir="rtl"
              />
              {errors.state && <span style={S.errorText}>{errors.state}</span>}
            </label>
          </div>

          {/* Postal code + Country */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              الرمز البريدي *
              <input
                style={inputStyle("postalCode")}
                value={form.postalCode}
                onChange={set("postalCode")}
                placeholder="11564"
                dir="ltr"
              />
              {errors.postalCode && (
                <span style={S.errorText}>{errors.postalCode}</span>
              )}
            </label>
            <label style={S.label}>
              الدولة *
              <input
                style={inputStyle("country")}
                value={form.country}
                onChange={set("country")}
                placeholder="المملكة العربية السعودية"
                dir="rtl"
              />
              {errors.country && <span style={S.errorText}>{errors.country}</span>}
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
              disabled={saving}
              style={{
                height: 40,
                padding: "0 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                height: 40,
                padding: "0 1.5rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: saving
                  ? "var(--color-brand-400)"
                  : "var(--color-brand-600)",
                fontSize: 13,
                fontWeight: 700,
                color: "#FFF",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-sans)",
              }}
            >
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة العنوان" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}