"use client";


import { useEffect, useRef, useState } from "react";
import { Alert, Spinner } from "../UI";
import { get } from "../../services/api";
import { getStoredToken } from "../../lib/auth";
import type {
  Driver,
  DriverFormErrors,
  CreateDriverPayload,
  UpdateDriverPayload,
  NationalIdType,
  DriverCardType,
  DriverStatus,
} from "../../types/driver";
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

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "var(--color-text-hint)",
  fontWeight: 700,
  margin: "0.5rem 0 0",
};

// ── Date helper ──────────────────────────────────────────────────────────────
function toIsoDateTime(val: string): string {
  if (!val) return val;
  if (val.includes("T")) return val;
  return `${val}T00:00:00.000Z`;
}

// ── Validation ───────────────────────────────────────────────────────────────
function validate(form: Partial<CreateDriverPayload>): DriverFormErrors {
  const e: DriverFormErrors = {};
  if (!form.name?.trim()) e.name = "الاسم مطلوب";
  if (!form.phone?.trim()) e.phone = "رقم الجوال مطلوب";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = "البريد الإلكتروني غير صالح";
  return e;
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

  // ── Local branches (auto-fetched if prop is empty) ─────────────────────────
  const [branches, setBranches] = useState<Branch[]>(branchesProp);
  useEffect(() => {
    if (branchesProp.length > 0) {
      setBranches(branchesProp);
      return;
    }
    const token = getStoredToken();
    get<{ data: { data: Branch[] } }>("branches?limit=100", token)
      .then((res) => {
        const list =
          (res as unknown as { data: { data: Branch[] } }).data?.data ?? [];
        setBranches(list);
      })
      .catch(() => { /* silently ignore */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState(editDriver?.name ?? "");
  const [phone, setPhone] = useState(editDriver?.phone ?? "");
  const [email, setEmail] = useState(editDriver?.email ?? "");
  const [address, setAddress] = useState(editDriver?.address ?? "");
  const [nationality, setNationality] = useState(editDriver?.nationality ?? "");
  const [nationalIdType, setNationalIdType] = useState<NationalIdType | "">(
    editDriver?.nationalIdType ?? "",
  );
  const [nationalId, setNationalId] = useState(
    // nationalId is not in CreateDriverPayload — read-only from Driver
    (editDriver as Driver & { nationalId?: string })?.nationalId ?? "",
  );
  const [nationalIdExpiry, setNationalIdExpiry] = useState(
    (editDriver as Driver & { nationalIdExpiry?: string })?.nationalIdExpiry?.slice(0, 10) ?? "",
  );
  const [gosiNumber, setGosiNumber] = useState(editDriver?.gosiNumber ?? "");
  const [licenseNumber, setLicenseNumber] = useState(editDriver?.licenseNumber ?? "");
  const [licenseType, setLicenseType] = useState(editDriver?.licenseType ?? "");
  const [licenseExpiry, setLicenseExpiry] = useState(
    editDriver?.licenseExpiry?.slice(0, 10) ?? "",
  );
  const [driverCardNumber, setDriverCardNumber] = useState(editDriver?.driverCardNumber ?? "");
  const [driverCardType, setDriverCardType] = useState<DriverCardType | "">(
    editDriver?.driverCardType ?? "",
  );
  const [driverCardExpiry, setDriverCardExpiry] = useState(
    editDriver?.driverCardExpiry?.slice(0, 10) ?? "",
  );
  const [driverType, setDriverType] = useState(editDriver?.driverType ?? "");
  const [branchId, setBranchId] = useState(
    (editDriver as Driver & { branchId?: string })?.branchId ?? "",
  );
  const [status, setStatus] = useState<DriverStatus>(editDriver?.status ?? "Active");

  // Photo state (new uploads only)
  const [photo, setPhoto] = useState<File | null>(null);
  const [nationalPhoto, setNationalPhoto] = useState<File | null>(null);
  const [driverCardPhoto, setDriverCardPhoto] = useState<File | null>(null);

  const [errors, setErrors] = useState<DriverFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Input error style ──────────────────────────────────────────────────────
  const inputStyle = (field: keyof DriverFormErrors): React.CSSProperties => ({
    ...inputBase,
    ...(errors[field] ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
  });

  const clearFieldError = (field: keyof DriverFormErrors) =>
    setErrors((p) => ({ ...p, [field]: undefined }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate({ name, phone, email: email || undefined });
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const raw: Record<string, unknown> = { name, phone };
    if (email)           raw.email = email;
    if (address)         raw.address = address;
    if (nationality)     raw.nationality = nationality;
    if (nationalIdType)  raw.nationalIdType = nationalIdType;
    if (gosiNumber)      raw.gosiNumber = gosiNumber;
    if (licenseNumber)   raw.licenseNumber = licenseNumber;
    if (licenseType)     raw.licenseType = licenseType;
    if (licenseExpiry)   raw.licenseExpiry = toIsoDateTime(licenseExpiry);
    if (driverCardNumber) raw.driverCardNumber = driverCardNumber;
    if (driverCardType)  raw.driverCardType = driverCardType;
    if (driverCardExpiry) raw.driverCardExpiry = toIsoDateTime(driverCardExpiry);
    if (driverType)      raw.driverType = driverType;
    if (branchId)        raw.branchId = branchId;
    if (!isNew)          raw.status = status;
    if (photo)           raw.photo = photo;
    if (nationalPhoto)   raw.nationalPhoto = nationalPhoto;
    if (driverCardPhoto) raw.driverCardPhoto = driverCardPhoto;

    const payload = raw as unknown as CreateDriverPayload;

    setSaving(true);
    setApiError("");
    const ok = await onSubmit(payload, isNew);
    setSaving(false);
    if (ok) onClose();
    else setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
  };

  // ── File input helper ──────────────────────────────────────────────────────
  function FileInput({
    label: lbl,
    current,
    onChange,
  }: {
    label: string;
    current: File | null;
    onChange: (f: File | null) => void;
  }) {
    return (
      <label style={labelStyle}>
        {lbl}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          style={{
            ...inputBase,
            padding: "0.35rem 0.75rem",
            height: "auto",
            cursor: "pointer",
          }}
        />
        {current && (
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {current.name}
          </span>
        )}
      </label>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="driver-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 640,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden", margin: "auto",
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
              {isNew ? "إضافة سائق" : "تعديل سائق"}
            </p>
            <h2 id="driver-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {isNew ? "سائق جديد" : editDriver?.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-surface)",
              cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            padding: "1.5rem",
            display: "flex", flexDirection: "column", gap: "1rem",
            maxHeight: "75vh", overflowY: "auto",
          }}
          dir="rtl"
        >
          {apiError && (
            <Alert type="error" message={apiError} onClose={() => setApiError("")} />
          )}

          {/* ── Section: Personal Info ── */}
          <p style={sectionHeadingStyle}>البيانات الشخصية</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              الاسم الكامل *
              <input
                ref={firstRef}
                style={inputStyle("name")}
                value={name}
                onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                placeholder="محمد عبدالله"
                dir="rtl"
                autoComplete="off"
              />
              {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
            </label>

            <label style={labelStyle}>
              رقم الجوال *
              <input
                style={inputStyle("phone")}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }}
                placeholder="05XXXXXXXX"
                dir="ltr"
              />
              {errors.phone && <span style={errorTextStyle}>{errors.phone}</span>}
            </label>

            <label style={labelStyle}>
              البريد الإلكتروني
              <input
                style={inputStyle("email")}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                placeholder="example@mail.com"
                dir="ltr"
              />
              {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
            </label>

            <label style={labelStyle}>
              الجنسية
              <input
                style={inputBase}
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="سعودي"
                dir="rtl"
              />
            </label>

            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              العنوان
              <input
                style={inputBase}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="الرياض، حي..."
                dir="rtl"
              />
            </label>
          </div>

          {/* ── Section: ID & GOSI ── */}
          <p style={sectionHeadingStyle}>الهوية والتأمينات</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              نوع الهوية
              <select
                style={{ ...inputBase, cursor: "pointer" }}
                value={nationalIdType}
                onChange={(e) => setNationalIdType(e.target.value as NationalIdType | "")}
                dir="rtl"
              >
                <option value="">اختر النوع</option>
                <option value="NationalID">هوية وطنية</option>
                <option value="Iqama">إقامة</option>
                <option value="Passport">جواز سفر</option>
              </select>
            </label>

            <label style={labelStyle}>
              رقم الهوية
              <input
                style={inputBase}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="1XXXXXXXXX"
                dir="ltr"
              />
            </label>

            <label style={labelStyle}>
              انتهاء الهوية
              <input
                style={inputBase}
                type="date"
                value={nationalIdExpiry}
                onChange={(e) => setNationalIdExpiry(e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              رقم GOSI
              <input
                style={inputBase}
                value={gosiNumber}
                onChange={(e) => setGosiNumber(e.target.value)}
                placeholder="GOSI-XXXX"
                dir="ltr"
              />
            </label>
          </div>

          {/* ── Section: License ── */}
          <p style={sectionHeadingStyle}>رخصة القيادة</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              رقم الرخصة
              <input
                style={inputStyle("licenseNumber")}
                value={licenseNumber}
                onChange={(e) => { setLicenseNumber(e.target.value); clearFieldError("licenseNumber"); }}
                placeholder="LIC-XXXX"
                dir="ltr"
              />
              {errors.licenseNumber && <span style={errorTextStyle}>{errors.licenseNumber}</span>}
            </label>

            <label style={labelStyle}>
              نوع الرخصة
              <input
                style={inputBase}
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                placeholder="خاص / عام"
                dir="rtl"
              />
            </label>

            <label style={labelStyle}>
              انتهاء الرخصة
              <input
                style={inputBase}
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
              />
            </label>
          </div>

          {/* ── Section: Driver Card ── */}
          <p style={sectionHeadingStyle}>بطاقة السائق</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              رقم البطاقة
              <input
                style={inputBase}
                value={driverCardNumber}
                onChange={(e) => setDriverCardNumber(e.target.value)}
                placeholder="CARD-XXXX"
                dir="ltr"
              />
            </label>

            <label style={labelStyle}>
              نوع البطاقة
              <select
                style={{ ...inputBase, cursor: "pointer" }}
                value={driverCardType}
                onChange={(e) => setDriverCardType(e.target.value as DriverCardType | "")}
                dir="rtl"
              >
                <option value="">اختر النوع</option>
                <option value="Temporary">مؤقتة</option>
                <option value="Seasonal">موسمية</option>
                <option value="Annual">سنوية</option>
                <option value="Restricted">مقيدة</option>
              </select>
            </label>

            <label style={labelStyle}>
              انتهاء البطاقة
              <input
                style={inputBase}
                type="date"
                value={driverCardExpiry}
                onChange={(e) => setDriverCardExpiry(e.target.value)}
              />
            </label>
          </div>

          {/* ── Section: Operational ── */}
          <p style={sectionHeadingStyle}>بيانات تشغيلية</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              الفرع
              <select
                style={{ ...inputBase, cursor: "pointer" }}
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                dir="rtl"
              >
                <option value="">اختر الفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              نوع السائق
              <input
                style={inputBase}
                value={driverType}
                onChange={(e) => setDriverType(e.target.value)}
                placeholder="رئيسي / احتياطي"
                dir="rtl"
              />
            </label>

            {!isNew && (
              <label style={labelStyle}>
                الحالة
                <select
                  style={{ ...inputBase, cursor: "pointer" }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DriverStatus)}
                  dir="rtl"
                >
                  <option value="Active">نشط</option>
                  <option value="InTrip">في رحلة</option>
                  <option value="Inactive">غير نشط</option>
                  <option value="Suspended">موقوف</option>
                </select>
              </label>
            )}
          </div>

          {/* ── Section: Photos ── */}
          <p style={sectionHeadingStyle}>الصور والمستندات</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <FileInput label="صورة السائق" current={photo} onChange={setPhoto} />
            <FileInput label="صورة الهوية" current={nationalPhoto} onChange={setNationalPhoto} />
            <FileInput label="صورة البطاقة" current={driverCardPhoto} onChange={setDriverCardPhoto} />
          </div>

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                height: 40, padding: "0 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)",
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
                height: 40, padding: "0 1.5rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)",
                fontSize: 13, fontWeight: 700, color: "#FFF",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-sans)",
              }}
            >
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة السائق" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}