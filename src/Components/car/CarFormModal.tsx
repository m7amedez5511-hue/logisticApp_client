"use client";

import { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { Alert, Spinner } from "../UI";
import { get } from "@/src/services/api";
import { getStoredToken } from "@/src/lib/auth";
import { createCarSchema, updateCarSchema } from "@/src/validations/car.validator";
import type {
  Car,
  CarFormErrors,
  CreateCarPayload,
  InsuranceStatus,
  UpdateCarPayload,
} from "@/src/types/car";
import type { Branch } from "@/src/types/branch";

// ── Shared input style ────────────────────────────────────────────────────────

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

// ── yup validation ────────────────────────────────────────────────────────────

async function validate(
  form: Partial<CreateCarPayload>,
  isNew: boolean,
): Promise<CarFormErrors> {
  const schema = isNew ? createCarSchema : updateCarSchema;
  try {
    await schema.validate(form, { abortEarly: false });
    return {};
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return err.inner.reduce<CarFormErrors>((acc, e) => {
        const field = e.path as keyof CarFormErrors;
        if (field && !acc[field]) acc[field] = e.message;
        return acc;
      }, {});
    }
    return {};
  }
}

// ── Date helper ───────────────────────────────────────────────────────────────
// <input type="date"> gives "YYYY-MM-DD"; backend expects full ISO-8601.

function toIsoDateTime(val: string): string {
  if (!val) return val;
  if (val.includes("T")) return val;
  return `${val}T00:00:00.000Z`;
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
      .catch(() => {
        /* silently ignore */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [manufacturer, setManufacturer] = useState(editCar?.manufacturer ?? "");
  const [model, setModel] = useState(editCar?.model ?? "");
  const [color, setColor] = useState(editCar?.color ?? "");
  const [plateNumber, setPlateNumber] = useState(editCar?.plateNumber ?? "");
  const [plateLetters, setPlateLetters] = useState(editCar?.plateLetters ?? "");
  const [plateType, setPlateType] = useState(editCar?.plateType ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(
    editCar?.registrationNumber ?? "",
  );
  const [vinNumber, setVinNumber] = useState(editCar?.vinNumber ?? "");
  const [branchId, setBranchId] = useState(editCar?.branch?.id ?? "");
  const [currentStatus, setCurrentStatus] = useState<Car["currentStatus"]>(
    editCar?.currentStatus ?? "Active",
  );
  const [insuranceStatus, setInsuranceStatus] = useState<InsuranceStatus>(
    (editCar?.insuranceStatus as InsuranceStatus) ?? "Valid",
  );
  const [registrationExpiryDate, setRegistrationExpiryDate] = useState(
    editCar?.registrationExpiryDate?.slice(0, 10) ?? "",
  );
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(
    editCar?.insuranceExpiryDate?.slice(0, 10) ?? "",
  );
  const [inspectionExpiryDate, setInspectionExpiryDate] = useState(
    editCar?.inspectionExpiryDate?.slice(0, 10) ?? "",
  );
  const [gpsDeviceId, setGpsDeviceId] = useState(editCar?.gpsDeviceId ?? "");
  const [year, setYear] = useState<number | undefined>(
    editCar?.year ?? new Date().getFullYear(),
  );
  const [capacity, setCapacity] = useState<number | undefined>(
    editCar?.capacity ?? undefined,
  );
  const [weight, setWeight] = useState<number | undefined>(
    editCar?.weight ?? undefined,
  );

  const [errors, setErrors] = useState<CarFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const parseNum = (v: string): number | undefined =>
    v.trim() === "" ? undefined : Number(v);

  const inputStyle = (field: keyof CarFormErrors): React.CSSProperties => ({
    ...inputBase,
    ...(errors[field]
      ? { borderColor: "var(--color-danger)", background: "#FEF2F2" }
      : {}),
  });

  const clearFieldError = (field: keyof CarFormErrors) =>
    setErrors((p) => ({ ...p, [field]: undefined }));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build snapshot for yup — include all fields so optional rules also run
    const formSnapshot: Partial<CreateCarPayload> = {
      manufacturer,
      model,
      year,
      plateNumber,
      plateLetters,
      currentStatus,
      insuranceStatus,
      registrationNumber,
      vinNumber,
      ...(color && { color }),
      ...(plateType && { plateType }),
      ...(branchId && { branchId }),
      ...(registrationExpiryDate && { registrationExpiryDate }),
      ...(insuranceExpiryDate && { insuranceExpiryDate }),
      ...(inspectionExpiryDate && { inspectionExpiryDate }),
      ...(gpsDeviceId && { gpsDeviceId }),
      ...(capacity !== undefined && { capacity }),
      ...(weight !== undefined && { weight }),
    };

    const errs = await validate(formSnapshot, isNew);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    // Build final payload — convert date strings to ISO-8601 for the backend
    const raw: Record<string, unknown> = {
      manufacturer,
      model,
      year,
      plateNumber,
      plateLetters,
      currentStatus,
    };
    if (color) raw.color = color;
    if (plateType) raw.plateType = plateType;
    if (registrationNumber) raw.registrationNumber = registrationNumber;
    if (vinNumber) raw.vinNumber = vinNumber;
    if (branchId) raw.branchId = branchId;
    if (insuranceStatus) raw.insuranceStatus = insuranceStatus;
    if (registrationExpiryDate)
      raw.registrationExpiryDate = toIsoDateTime(registrationExpiryDate);
    if (insuranceExpiryDate)
      raw.insuranceExpiryDate = toIsoDateTime(insuranceExpiryDate);
    if (inspectionExpiryDate)
      raw.inspectionExpiryDate = toIsoDateTime(inspectionExpiryDate);
    if (gpsDeviceId) raw.gpsDeviceId = gpsDeviceId;
    if (capacity !== undefined) raw.capacity = capacity;
    if (weight !== undefined) raw.weight = weight;

    const payload = raw as unknown as CreateCarPayload;
    setSaving(true);
    setApiError("");
    const ok = await onSubmit(payload, isNew);
    setSaving(false);
    if (ok) onClose();
    else setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="car-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          margin: "auto",
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
              {isNew ? "إضافة مركبة" : "تعديل مركبة"}
            </p>
            <h2
              id="car-modal-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "4px 0 0",
              }}
            >
              {isNew
                ? "مركبة جديدة"
                : `${editCar?.manufacturer} ${editCar?.model}`}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxHeight: "75vh",
            overflowY: "auto",
          }}
          dir="rtl"
        >
          {apiError && (
            <Alert
              type="error"
              message={apiError}
              onClose={() => setApiError("")}
            />
          )}

          {/* ── Section: Basic Info ── */}
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--color-text-hint)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            بيانات أساسية
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={labelStyle}>
              الشركة المصنعة *
              <input
                ref={firstRef}
                style={inputStyle("manufacturer")}
                value={manufacturer}
                onChange={(e) => {
                  setManufacturer(e.target.value);
                  clearFieldError("manufacturer");
                }}
                placeholder="تويوتا"
                dir="rtl"
                autoComplete="off"
              />
              {errors.manufacturer && (
                <span style={errorTextStyle}>{errors.manufacturer}</span>
              )}
            </label>
            <label style={labelStyle}>
              الموديل *
              <input
                style={inputStyle("model")}
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  clearFieldError("model");
                }}
                placeholder="لاند كروزر"
                dir="rtl"
              />
              {errors.model && (
                <span style={errorTextStyle}>{errors.model}</span>
              )}
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={labelStyle}>
              سنة الصنع *
              <input
                style={inputStyle("year")}
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                value={year ?? ""}
                onChange={(e) => {
                  setYear(parseNum(e.target.value));
                  clearFieldError("year");
                }}
                dir="ltr"
              />
              {errors.year && <span style={errorTextStyle}>{errors.year}</span>}
            </label>
            <label style={labelStyle}>
              اللون
              <input
                style={inputBase}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="أبيض"
                dir="rtl"
              />
            </label>
            <label style={labelStyle}>
              نوع اللوحة
              <input
                style={inputBase}
                value={plateType}
                onChange={(e) => setPlateType(e.target.value)}
                placeholder="خاص"
                dir="rtl"
              />
            </label>
          </div>

          {/* ── Section: Plate ── */}
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--color-text-hint)",
              fontWeight: 700,
              margin: "0.5rem 0 0",
            }}
          >
            بيانات اللوحة
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={labelStyle}>
              رقم اللوحة *
              <input
                style={inputStyle("plateNumber")}
                value={plateNumber}
                onChange={(e) => {
                  setPlateNumber(e.target.value);
                  clearFieldError("plateNumber");
                }}
                placeholder="1234"
                dir="ltr"
              />
              {errors.plateNumber && (
                <span style={errorTextStyle}>{errors.plateNumber}</span>
              )}
            </label>
            <label style={labelStyle}>
              حروف اللوحة *
              <input
                style={inputStyle("plateLetters")}
                value={plateLetters}
                onChange={(e) => {
                  setPlateLetters(e.target.value);
                  clearFieldError("plateLetters");
                }}
                placeholder="أ ب ج"
                dir="rtl"
              />
              {errors.plateLetters && (
                <span style={errorTextStyle}>{errors.plateLetters}</span>
              )}
            </label>
          </div>

          {/* ── Section: Registration & Legal ── */}
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--color-text-hint)",
              fontWeight: 700,
              margin: "0.5rem 0 0",
            }}
          >
            الترخيص والتأمين
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={labelStyle}>
              رقم الاستمارة *
              <input
                style={inputStyle("registrationNumber")}
                value={registrationNumber}
                onChange={(e) => {
                  setRegistrationNumber(e.target.value);
                  clearFieldError("registrationNumber");
                }}
                placeholder="SA-001234"
                dir="ltr"
              />
              {errors.registrationNumber && (
                <span style={errorTextStyle}>{errors.registrationNumber}</span>
              )}
            </label>
            <label style={labelStyle}>
              رقم الهيكل (VIN)
              <input
                style={inputStyle("vinNumber")}
                value={vinNumber}
                onChange={(e) => {
                  setVinNumber(e.target.value);
                  clearFieldError("vinNumber");
                }}
                placeholder="1HGBH41JXMN109186"
                dir="ltr"
              />
              {errors.vinNumber && (
                <span style={errorTextStyle}>{errors.vinNumber}</span>
              )}
            </label>
            <label style={labelStyle}>
              انتهاء الاستمارة
              <input
                style={inputBase}
                type="date"
                value={registrationExpiryDate}
                onChange={(e) => setRegistrationExpiryDate(e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              حالة التأمين
              <select
                style={{ ...inputBase, cursor: "pointer" }}
                value={insuranceStatus}
                onChange={(e) =>
                  setInsuranceStatus(e.target.value as InsuranceStatus)
                }
                dir="rtl"
              >
                <option value="Valid">سارٍ</option>
                <option value="Expired">منتهي</option>
                <option value="NotInsured">غير مؤمَّن</option>
              </select>
            </label>
            <label style={labelStyle}>
              انتهاء التأمين
              <input
                style={inputBase}
                type="date"
                value={insuranceExpiryDate}
                onChange={(e) => setInsuranceExpiryDate(e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              انتهاء الفحص الدوري
              <input
                style={inputBase}
                type="date"
                value={inspectionExpiryDate}
                onChange={(e) => setInspectionExpiryDate(e.target.value)}
              />
            </label>
          </div>

          {/* ── Section: Operational ── */}
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--color-text-hint)",
              fontWeight: 700,
              margin: "0.5rem 0 0",
            }}
          >
            بيانات تشغيلية
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
            }}
          >
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
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              الحالة
              <select
                style={{ ...inputBase, cursor: "pointer" }}
                value={currentStatus}
                onChange={(e) =>
                  setCurrentStatus(e.target.value as Car["currentStatus"])
                }
                dir="rtl"
              >
                <option value="Active">نشط</option>
                <option value="InMaintenance">صيانة</option>
                <option value="InTrip">في رحلة</option>
                <option value="Inactive">غير نشط</option>
              </select>
            </label>
            <label style={labelStyle}>
              رقم GPS
              <input
                style={inputBase}
                value={gpsDeviceId}
                onChange={(e) => setGpsDeviceId(e.target.value)}
                placeholder="GPS-001"
                dir="ltr"
              />
            </label>
            <label style={labelStyle}>
              الطاقة الاستيعابية
              <input
                style={inputStyle("capacity")}
                type="number"
                min={0}
                value={capacity ?? ""}
                onChange={(e) => {
                  setCapacity(parseNum(e.target.value));
                  clearFieldError("capacity");
                }}
                placeholder="0"
                dir="ltr"
              />
              {errors.capacity && (
                <span style={errorTextStyle}>{errors.capacity}</span>
              )}
            </label>
            <label style={labelStyle}>
              الوزن (كجم)
              <input
                style={inputStyle("weight")}
                type="number"
                min={0}
                value={weight ?? ""}
                onChange={(e) => {
                  setWeight(parseNum(e.target.value));
                  clearFieldError("weight");
                }}
                placeholder="0"
                dir="ltr"
              />
              {errors.weight && (
                <span style={errorTextStyle}>{errors.weight}</span>
              )}
            </label>
          </div>

          {/* ── Actions ── */}
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
              {saving
                ? "جارٍ الحفظ…"
                : isNew
                  ? "إضافة المركبة"
                  : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}