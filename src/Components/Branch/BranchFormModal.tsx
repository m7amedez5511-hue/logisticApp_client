"use client";

import { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { Alert, Spinner } from "../UI";
import { createBranchSchema, updateBranchSchema } from "@/src/validations/branch.validator";
import type { Branch, BranchFormData, FormErrors } from "@/src/types/branch";

// ── fixed styles ─────────────────────────────────────────
const S = {
  input: {
    width: "100%", height: 40, padding: "0 0.75rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    fontSize: 13, color: "var(--color-text-primary)",
    outline: "none", fontFamily: "var(--font-sans)",
  } as React.CSSProperties,
  label: {
    display: "flex", flexDirection: "column" as const,
    gap: 6, fontSize: 12, fontWeight: 600,
    color: "var(--color-text-secondary)",
  } as React.CSSProperties,
  errorText: { fontSize: 11, color: "var(--color-danger)", fontWeight: 500 } as React.CSSProperties,
};

// ── yup validation ────────────────────────────────────────────────────────────
async function validate(data: BranchFormData, isNew: boolean): Promise<FormErrors> {
  const schema = isNew ? createBranchSchema : updateBranchSchema;
  try {
    await schema.validate(data, { abortEarly: false });
    return {};
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return err.inner.reduce<FormErrors>((acc, e) => {
        const field = e.path as keyof FormErrors;
        if (field && !acc[field]) acc[field] = e.message;
        return acc;
      }, {});
    }
    return {};
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface BranchFormModalProps {
  editBranch: Branch | null;
  onClose:    () => void;
  onSubmit:   (data: BranchFormData, isNew: boolean) => Promise<boolean>;
}

// ── main component ────────────────────────────────────────────────────────────
export function BranchFormModal({ editBranch, onClose, onSubmit }: BranchFormModalProps) {
  const isNew = editBranch === null;

  const [form, setForm] = useState<BranchFormData>({
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
  });
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");
  const firstInputRef           = useRef<HTMLInputElement>(null);

  useEffect(() => { firstInputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (field: keyof BranchFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      // clear field error on change
      if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = await validate(form, isNew);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiError("");
    const ok = await onSubmit(form, isNew);
    setSaving(false);
    if (ok) onClose();
    else setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
  };

  // dynamic styles for inputs with errors
  const inputStyle = (field: keyof FormErrors): React.CSSProperties => ({
    ...S.input,
    ...(errors[field] ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
  });

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="branch-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
              {isNew ? "إضافة فرع" : "تعديل فرع"}
            </p>
            <h2 id="branch-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {isNew ? "فرع جديد" : editBranch?.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
          {apiError && <Alert type="error" message={apiError} onClose={() => setApiError("")} />}

          {/* name */}
          <label style={S.label}>
            اسم الفرع *
            <input ref={firstInputRef} style={inputStyle("name")} value={form.name} onChange={set("name")} placeholder="فرع الرياض" autoComplete="organization" dir="rtl" />
            {errors.name && <span style={S.errorText}>{errors.name}</span>}
          </label>

          {/* email + phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              البريد الإلكتروني
              <input style={inputStyle("email")} type="email" value={form.email} onChange={set("email")} placeholder="branch@co.sa" autoComplete="email" dir="ltr" />
              {errors.email && <span style={S.errorText}>{errors.email}</span>}
            </label>
            <label style={S.label}>
              رقم الهاتف
              <input style={inputStyle("phone")} type="tel" value={form.phone} onChange={set("phone")} placeholder="+966 5x xxx xxxx" autoComplete="tel" dir="ltr" />
              {errors.phone && <span style={S.errorText}>{errors.phone}</span>}
            </label>
          </div>

          {/* city + street */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              المدينة *
              <input style={inputStyle("city")} value={form.city} onChange={set("city")} placeholder="الرياض" dir="rtl" />
              {errors.city && <span style={S.errorText}>{errors.city}</span>}
            </label>
            <label style={S.label}>
              الشارع *
              <input style={inputStyle("street")} value={form.street} onChange={set("street")} placeholder="شارع الملك فهد" dir="rtl" />
              {errors.street && <span style={S.errorText}>{errors.street}</span>}
            </label>
          </div>

          {/* state + district */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              المنطقة
              <input style={inputStyle("state")} value={form.state} onChange={set("state")} placeholder="منطقة الرياض" dir="rtl" />
              {errors.state && <span style={S.errorText}>{errors.state}</span>}
            </label>
            <label style={S.label}>
              الحي
              <input style={inputStyle("district")} value={form.district} onChange={set("district")} placeholder="حي العليا" dir="rtl" />
              {errors.district && <span style={S.errorText}>{errors.district}</span>}
            </label>
          </div>

          {/* buildingNo + unitNo + zipCode */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              رقم المبنى
              <input style={inputStyle("buildingNo")} value={form.buildingNo} onChange={set("buildingNo")} placeholder="1234" dir="ltr" />
              {errors.buildingNo && <span style={S.errorText}>{errors.buildingNo}</span>}
            </label>
            <label style={S.label}>
              رقم الوحدة
              <input style={inputStyle("unitNo")} value={form.unitNo} onChange={set("unitNo")} placeholder="5" dir="ltr" />
              {errors.unitNo && <span style={S.errorText}>{errors.unitNo}</span>}
            </label>
            <label style={S.label}>
              الرمز البريدي
              <input style={inputStyle("zipCode")} value={form.zipCode} onChange={set("zipCode")} placeholder="12345" dir="ltr" />
              {errors.zipCode && <span style={S.errorText}>{errors.zipCode}</span>}
            </label>
          </div>

          {/* country */}
          <label style={S.label}>
            الدولة
            <input style={inputStyle("country")} value={form.country} onChange={set("country")} placeholder="SA" dir="ltr" />
            {errors.country && <span style={S.errorText}>{errors.country}</span>}
          </label>

          {/* latitude + longitude */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              خط العرض (اختياري)
              <input style={inputStyle("latitude")} value={form.latitude} onChange={set("latitude")} placeholder="24.7136" dir="ltr" inputMode="decimal" />
              {errors.latitude && <span style={S.errorText}>{errors.latitude}</span>}
            </label>
            <label style={S.label}>
              خط الطول (اختياري)
              <input style={inputStyle("longitude")} value={form.longitude} onChange={set("longitude")} placeholder="46.6753" dir="ltr" inputMode="decimal" />
              {errors.longitude && <span style={S.errorText}>{errors.longitude}</span>}
            </label>
          </div>

          {/* actions */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
              إلغاء
            </button>
            <button type="submit" disabled={saving}
              style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة الفرع" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}