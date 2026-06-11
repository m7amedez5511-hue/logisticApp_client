"use client";
// Components/Car/CarFormModal.tsx
// Modal for creating or editing a car record.

import { useEffect, useRef, useState } from "react";
import { Alert, Spinner } from "../UI";
import type { Car, CarFormErrors, CreateCarPayload, UpdateCarPayload } from "../../types/car";
import type { Branch } from "../../types/branch";

// ── Shared input style ───────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
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
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};

const errorTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--color-danger)",
  fontWeight: 500,
};

// ── Validation ───────────────────────────────────────────────────────────────
function validate(form: Partial<CreateCarPayload>, isNew: boolean): CarFormErrors {
  const e: CarFormErrors = {};
  if (!form.manufacturer?.trim()) e.manufacturer = "الشركة المصنعة مطلوبة";
  if (!form.model?.trim()) e.model = "الموديل مطلوب";
  if (!form.year || form.year < 1900 || form.year > new Date().getFullYear() + 1)
    e.year = "سنة غير صالحة";
  if (!form.plateNumber?.trim()) e.plateNumber = "رقم اللوحة مطلوب";
  if (!form.plateLetters?.trim()) e.plateLetters = "حروف اللوحة مطلوبة";
  return e;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface CarFormModalProps {
  editCar: Car | null;
  branches: Branch[];
  onClose: () => void;
  onSubmit: (payload: CreateCarPayload | UpdateCarPayload, isNew: boolean) => Promise<boolean>;
}

// ── Component ────────────────────────────────────────────────────────────────
export function CarFormModal({ editCar, branches, onClose, onSubmit }: CarFormModalProps) {
  const isNew = editCar === null;

  const [form, setForm] = useState<Partial<CreateCarPayload>>({
    manufacturer:           editCar?.manufacturer ?? "",
    model:                  editCar?.model ?? "",
    year:                   editCar?.year ?? new Date().getFullYear(),
    color:                  editCar?.color ?? "",
    plateNumber:            editCar?.plateNumber ?? "",
    plateLetters:           editCar?.plateLetters ?? "",
    plateType:              editCar?.plateType ?? "",
    registrationNumber:     editCar?.registrationNumber ?? "",
    vinNumber:              editCar?.vinNumber ?? "",
    branchId:               editCar?.branch?.id ?? "",
    currentStatus:          editCar?.currentStatus ?? "Active",
    insuranceStatus:        editCar?.insuranceStatus ?? "Valid",
    registrationExpiryDate: editCar?.registrationExpiryDate?.slice(0, 10) ?? "",
    insuranceExpiryDate:    editCar?.insuranceExpiryDate?.slice(0, 10) ?? "",
    inspectionExpiryDate:   editCar?.inspectionExpiryDate?.slice(0, 10) ?? "",
    capacity:               editCar?.capacity ?? undefined,
    weight:                 editCar?.weight ?? undefined,
  });

  const [errors,   setErrors]   = useState<CarFormErrors>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");
  const firstRef               = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Field helpers ────────────────────────────────────────────────────────
  const setStr = (field: keyof CreateCarPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      if (errors[field as keyof CarFormErrors])
        setErrors(p => ({ ...p, [field]: undefined }));
    };

  const setNum = (field: keyof CreateCarPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value === "" ? undefined : Number(e.target.value);
      setForm(p => ({ ...p, [field]: v }));
      if (errors[field as keyof CarFormErrors])
        setErrors(p => ({ ...p, [field]: undefined }));
    };

  const inputStyle = (field: keyof CarFormErrors): React.CSSProperties => ({
    ...inputBase,
    ...(errors[field] ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
  });

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, isNew);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError("");

    // Strip empty strings to avoid schema rejection
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "" && v !== undefined),
    ) as CreateCarPayload;

    const ok = await onSubmit(payload, isNew);
    setSaving(false);
    if (ok) onClose();
    else setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="car-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 620,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
              {isNew ? "إضافة مركبة" : "تعديل مركبة"}
            </p>
            <h2 id="car-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {isNew ? "مركبة جديدة" : `${editCar?.manufacturer} ${editCar?.model}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "75vh", overflowY: "auto" }}>
          {apiError && <Alert type="error" message={apiError} onClose={() => setApiError("")} />}

          {/* Section: Basic Info */}
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: 0 }}>
            بيانات أساسية
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              الشركة المصنعة *
              <input ref={firstRef} style={inputStyle("manufacturer")} value={form.manufacturer ?? ""} onChange={setStr("manufacturer")} placeholder="تويوتا" dir="rtl" />
              {errors.manufacturer && <span style={errorTextStyle}>{errors.manufacturer}</span>}
            </label>
            <label style={labelStyle}>
              الموديل *
              <input style={inputStyle("model")} value={form.model ?? ""} onChange={setStr("model")} placeholder="لاند كروزر" dir="rtl" />
              {errors.model && <span style={errorTextStyle}>{errors.model}</span>}
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              سنة الصنع *
              <input style={inputStyle("year")} type="number" min={1900} max={new Date().getFullYear() + 1} value={form.year ?? ""} onChange={setNum("year")} dir="ltr" />
              {errors.year && <span style={errorTextStyle}>{errors.year}</span>}
            </label>
            <label style={labelStyle}>
              اللون
              <input style={inputBase} value={form.color ?? ""} onChange={setStr("color")} placeholder="أبيض" dir="rtl" />
            </label>
            <label style={labelStyle}>
              نوع اللوحة
              <input style={inputBase} value={form.plateType ?? ""} onChange={setStr("plateType")} placeholder="خاص" dir="rtl" />
            </label>
          </div>

          {/* Section: Plate */}
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "0.5rem 0 0" }}>
            بيانات اللوحة
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              رقم اللوحة *
              <input style={inputStyle("plateNumber")} value={form.plateNumber ?? ""} onChange={setStr("plateNumber")} placeholder="1234" dir="ltr" />
              {errors.plateNumber && <span style={errorTextStyle}>{errors.plateNumber}</span>}
            </label>
            <label style={labelStyle}>
              حروف اللوحة *
              <input style={inputStyle("plateLetters")} value={form.plateLetters ?? ""} onChange={setStr("plateLetters")} placeholder="أ ب ج" dir="rtl" />
              {errors.plateLetters && <span style={errorTextStyle}>{errors.plateLetters}</span>}
            </label>
          </div>

          {/* Section: Registration & Legal */}
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "0.5rem 0 0" }}>
            الترخيص والتأمين
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              رقم الاستمارة
              <input style={inputBase} value={form.registrationNumber ?? ""} onChange={setStr("registrationNumber")} placeholder="SA-001234" dir="ltr" />
            </label>
            <label style={labelStyle}>
              رقم الهيكل (VIN)
              <input style={inputBase} value={form.vinNumber ?? ""} onChange={setStr("vinNumber")} placeholder="1HGBH41JXMN109186" dir="ltr" />
            </label>
            <label style={labelStyle}>
              انتهاء الاستمارة
              <input style={inputBase} type="date" value={form.registrationExpiryDate ?? ""} onChange={setStr("registrationExpiryDate")} />
            </label>
            <label style={labelStyle}>
              حالة التأمين
              <select style={{ ...inputBase, cursor: "pointer" }} value={form.insuranceStatus ?? "Valid"} onChange={setStr("insuranceStatus")} dir="rtl">
                <option value="Valid">سارٍ</option>
                <option value="Expired">منتهي</option>
                <option value="NotInsured">غير مؤمَّن</option>
              </select>
            </label>
            <label style={labelStyle}>
              انتهاء التأمين
              <input style={inputBase} type="date" value={form.insuranceExpiryDate ?? ""} onChange={setStr("insuranceExpiryDate")} />
            </label>
            <label style={labelStyle}>
              انتهاء الفحص الدوري
              <input style={inputBase} type="date" value={form.inspectionExpiryDate ?? ""} onChange={setStr("inspectionExpiryDate")} />
            </label>
          </div>

          {/* Section: Operational */}
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "0.5rem 0 0" }}>
            بيانات تشغيلية
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              الفرع
              <select style={{ ...inputBase, cursor: "pointer" }} value={form.branchId ?? ""} onChange={setStr("branchId")} dir="rtl">
                <option value="">اختر الفرع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              الحالة
              <select style={{ ...inputBase, cursor: "pointer" }} value={form.currentStatus ?? "Active"} onChange={setStr("currentStatus")} dir="rtl">
                <option value="Active">نشط</option>
                <option value="InMaintenance">صيانة</option>
                <option value="InTrip">في رحلة</option>
                <option value="Inactive">غير نشط</option>
              </select>
            </label>
            <label style={labelStyle}>
              رقم GPS
              <input style={inputBase} value={form.gpsDeviceId ?? ""} onChange={setStr("gpsDeviceId")} placeholder="GPS-001" dir="ltr" />
            </label>
            <label style={labelStyle}>
              الطاقة الاستيعابية
              <input style={inputBase} type="number" min={0} value={form.capacity ?? ""} onChange={setNum("capacity")} placeholder="0" dir="ltr" />
            </label>
            <label style={labelStyle}>
              الوزن (كجم)
              <input style={inputBase} type="number" min={0} value={form.weight ?? ""} onChange={setNum("weight")} placeholder="0" dir="ltr" />
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
              إلغاء
            </button>
            <button type="submit" disabled={saving}
              style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة المركبة" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}