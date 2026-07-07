"use client";

import { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { Spinner } from "../UI";
import { get } from "@/src/services/api";
import { getStoredToken } from "@/src/lib/auth";
import {
  createTripSchema,
  updateTripSchema,
} from "@/src/validations/trip.validator";
import type { TripSchemaErrors } from "@/src/validations/trip.validator";
import type {
  Trip,
  TripStatus,
  CreateTripPayload,
  UpdateTripPayload,
} from "@/src/types/trip";

// ── Shared styles ────────────────────────────────────────────────────────────

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

const optionalLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: "var(--color-text-hint)",
  marginRight: 4,
};

// ── Driver / Car / Branch minimal types ─────────────────────────────────────

interface DriverOption {
  id: string;
  name: string;
  phone: string;
  status: string;
}
interface CarOption {
  id: string;
  manufacturer: string;
  model: string;
  plateNumber: string;
  status?: string;
}
interface BranchOption {
  id: string;
  name: string;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface TripFormModalProps {
  editTrip: Trip | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateTripPayload | UpdateTripPayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TripFormModal({
  editTrip,
  onClose,
  onSubmit,
}: TripFormModalProps) {
  const isNew = editTrip === null;

  // ── Dropdown options ──────────────────────────────────────────────────────
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  useEffect(() => {
    const token = getStoredToken();
    get<{ data: { data: DriverOption[] } }>(
      "driver?limit=100&status=Active",
      token,
    )
      .then((res) =>
        setDrivers(
          (res as unknown as { data: { data: DriverOption[] } }).data?.data ??
            [],
        ),
      )
      .catch(() => {});
    get<{ data: { data: CarOption[] } }>("cars?limit=100&currentStatus=Active", token)
      .then((res) =>
        setCars(
          (res as unknown as { data: { data: CarOption[] } }).data?.data ?? [],
        ),
      )
      .catch(() => {});
    get<{ data: { data: BranchOption[] } }>("branches?limit=100", token)
      .then((res) =>
        setBranches(
          (res as unknown as { data: { data: BranchOption[] } }).data?.data ??
            [],
        ),
      )
      .catch(() => {});
  }, []);
  //console.log("cars", cars);
  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(editTrip?.title ?? "");
  const [driverId, setDriverId] = useState(editTrip?.driverId ?? "");
  const [carId, setCarId] = useState(editTrip?.carId ?? "");
  const [branchId, setBranchId] = useState(editTrip?.branchId ?? "");
  const [status, setStatus] = useState<TripStatus>(
    editTrip?.status ?? "Scheduled",
  );
  const [startTime, setStartTime] = useState(
    editTrip?.startTime?.slice(0, 16) ?? "",
  );
  const [endTime, setEndTime] = useState(editTrip?.endTime?.slice(0, 16) ?? "");
  const [collectedCount, setCollectedCount] = useState<string>(
    editTrip?.collectedCount != null ? String(editTrip.collectedCount) : "",
  );
  const [deliveredCount, setDeliveredCount] = useState<string>(
    editTrip?.deliveredCount != null ? String(editTrip.deliveredCount) : "",
  );
  const [returnedCount, setReturnedCount] = useState<string>(
    editTrip?.returnedCount != null ? String(editTrip.returnedCount) : "",
  );
  const [totalCashCollected, setTotalCashCollected] = useState<string>(
    editTrip?.totalCashCollected != null
      ? String(editTrip.totalCashCollected)
      : "",
  );
  const [notes, setNotes] = useState(editTrip?.notes ?? "");
  const [endReason, setEndReason] = useState(editTrip?.endReason ?? "");
  const [reason, setReason] = useState(""); // update-only

  const [errors, setErrors] = useState<TripSchemaErrors>({});
  const [saving, setSaving] = useState(false);
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

  // ── Error style helper ────────────────────────────────────────────────────
  const inputStyle = (field: keyof TripSchemaErrors): React.CSSProperties => ({
    ...inputBase,
    ...(errors[field]
      ? { borderColor: "var(--color-danger)", background: "#FEF2F2" }
      : {}),
  });

  const clearErr = (field: keyof TripSchemaErrors) =>
    setErrors((p) => ({ ...p, [field]: undefined }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const raw: Record<string, unknown> = {
      title: title || undefined,
      driverId: driverId || undefined,
      carId: carId || undefined,
      branchId: branchId || undefined,
      status: status || undefined,
      startTime: startTime ? `${startTime}:00.000Z` : undefined,
      endTime: endTime ? `${endTime}:00.000Z` : undefined,
      collectedCount:
        collectedCount !== "" ? Number(collectedCount) : undefined,
      deliveredCount:
        deliveredCount !== "" ? Number(deliveredCount) : undefined,
      returnedCount: returnedCount !== "" ? Number(returnedCount) : undefined,
      totalCashCollected:
        totalCashCollected !== "" ? Number(totalCashCollected) : undefined,
      notes: notes || undefined,
      endReason: endReason || undefined,
      ...(!isNew && reason ? { reason } : {}),
    };

    // ── Client-side validation ────────────────────────────────────────────
    try {
      const schema = isNew ? createTripSchema : updateTripSchema;
      await schema.validate(raw, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const map: TripSchemaErrors = {};
        err.inner.forEach((e) => {
          if (e.path) (map as Record<string, string>)[e.path] = e.message;
        });
        setErrors(map);
      }
      return;
    }

    // ── Call parent handler (notification emitted by the hook) ────────────
    setSaving(true);
    try {
      const ok = await onSubmit(
        raw as CreateTripPayload | UpdateTripPayload,
        isNew,
      );
      if (ok) onClose();
      // on failure the hook already fired an error notification — nothing extra needed here
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "2rem 1rem",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 700,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 56px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            id="trip-form-title"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {isNew ? "إضافة رحلة جديدة" : "تعديل بيانات الرحلة"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: 4,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
          }}
        >
          {/* ── Section:trip management── */}
          <p style={sectionHeadingStyle}>أساسيات الرحلة</p>

          {/* Title */}
          <label style={labelStyle}>
            عنوان الرحلة <span style={{ color: "var(--color-danger)" }}>*</span>
            <input
              ref={firstRef}
              style={inputStyle("title")}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearErr("title");
              }}
              placeholder="مثال: توزيع الرياض الشمالي"
              dir="rtl"
            />
            {errors.title && <span style={errorTextStyle}>{errors.title}</span>}
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            {/* Driver */}
            <label style={labelStyle}>
              السائق <span style={{ color: "var(--color-danger)" }}>*</span>
              <select
                style={{ ...inputStyle("driverId"), cursor: "pointer" }}
                value={driverId}
                onChange={(e) => {
                  setDriverId(e.target.value);
                  clearErr("driverId");
                }}
                dir="rtl"
              >
                <option value="">اختر السائق</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.phone}
                  </option>
                ))}
              </select>
              {errors.driverId && (
                <span style={errorTextStyle}>{errors.driverId}</span>
              )}
            </label>

            {/* Car */}
            <label style={labelStyle}>
              السيارة <span style={{ color: "var(--color-danger)" }}>*</span>
              <select
                style={{ ...inputStyle("carId"), cursor: "pointer" }}
                value={carId}
                onChange={(e) => {
                  setCarId(e.target.value);
                  clearErr("carId");
                }}
                dir="rtl"
              >
                <option value="">اختر السيارة</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.manufacturer} {c.model} — {c.plateNumber}
                  </option>
                ))}
              </select>
              {errors.carId && (
                <span style={errorTextStyle}>{errors.carId}</span>
              )}
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            {/* Branch */}
            <label style={labelStyle}>
              الفرع <span style={{ color: "var(--color-danger)" }}>*</span>
              <select
                style={{ ...inputStyle("branchId"), cursor: "pointer" }}
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  clearErr("branchId");
                }}
                dir="rtl"
              >
                <option value="">اختر الفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <span style={errorTextStyle}>{errors.branchId}</span>
              )}
            </label>

            {/* Status */}
            <label style={labelStyle}>
              الحالة
              <select
                style={{ ...inputBase, cursor: "pointer" }}
                value={status}
                onChange={(e) => setStatus(e.target.value as TripStatus)}
                dir="rtl"
              >
                <option value="Scheduled">مجدولة</option>
                <option value="InProgress">جارية</option>
                <option value="Completed">مكتملة</option>
                <option value="Cancelled">ملغاة</option>
              </select>
            </label>
          </div>

          {/* ── Section: التوقيت ── */}
          <p style={sectionHeadingStyle}>التوقيت</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={labelStyle}>
              وقت البدء <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                type="datetime-local"
                style={inputStyle("startTime")}
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  clearErr("startTime");
                }}
              />
              {errors.startTime && (
                <span style={errorTextStyle}>{errors.startTime}</span>
              )}
            </label>

            <label style={labelStyle}>
              وقت الانتهاء <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                type="datetime-local"
                style={inputStyle("endTime")}
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  clearErr("endTime");
                }}
              />
              {errors.endTime && (
                <span style={errorTextStyle}>{errors.endTime}</span>
              )}
            </label>
          </div>

          {/* ── Section: الأعداد والمبالغ ── */}
          <p style={sectionHeadingStyle}>الأعداد والمبالغ</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={labelStyle}>
              المجمّع <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                type="number"
                min="0"
                style={inputStyle("collectedCount")}
                value={collectedCount}
                onChange={(e) => {
                  setCollectedCount(e.target.value);
                  clearErr("collectedCount");
                }}
                placeholder="0"
                dir="ltr"
              />
              {errors.collectedCount && (
                <span style={errorTextStyle}>{errors.collectedCount}</span>
              )}
            </label>

            <label style={labelStyle}>
              المُسلَّم <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                type="number"
                min="0"
                style={inputStyle("deliveredCount")}
                value={deliveredCount}
                onChange={(e) => {
                  setDeliveredCount(e.target.value);
                  clearErr("deliveredCount");
                }}
                placeholder="0"
                dir="ltr"
              />
              {errors.deliveredCount && (
                <span style={errorTextStyle}>{errors.deliveredCount}</span>
              )}
            </label>

            <label style={labelStyle}>
              المُرتجع <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                type="number"
                min="0"
                style={inputStyle("returnedCount")}
                value={returnedCount}
                onChange={(e) => {
                  setReturnedCount(e.target.value);
                  clearErr("returnedCount");
                }}
                placeholder="0"
                dir="ltr"
              />
              {errors.returnedCount && (
                <span style={errorTextStyle}>{errors.returnedCount}</span>
              )}
            </label>

            <label style={labelStyle}>
              النقد المحصّل <span style={optionalLabelStyle}>(اختياري)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                style={inputStyle("totalCashCollected")}
                value={totalCashCollected}
                onChange={(e) => {
                  setTotalCashCollected(e.target.value);
                  clearErr("totalCashCollected");
                }}
                placeholder="0.00"
                dir="ltr"
              />
              {errors.totalCashCollected && (
                <span style={errorTextStyle}>{errors.totalCashCollected}</span>
              )}
            </label>
          </div>

          {/* ── Section: ملاحظات ── */}
          <p style={sectionHeadingStyle}>ملاحظات</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={labelStyle}>
              ملاحظات <span style={optionalLabelStyle}>(اختياري)</span>
              <textarea
                style={{
                  ...inputBase,
                  height: 72,
                  padding: "0.5rem 0.75rem",
                  resize: "vertical",
                }}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  clearErr("notes");
                }}
                placeholder="أي ملاحظات إضافية…"
                dir="rtl"
              />
              {errors.notes && (
                <span style={errorTextStyle}>{errors.notes}</span>
              )}
            </label>

            <label style={labelStyle}>
              سبب الإنهاء <span style={optionalLabelStyle}>(اختياري)</span>
              <textarea
                style={{
                  ...inputBase,
                  height: 72,
                  padding: "0.5rem 0.75rem",
                  resize: "vertical",
                }}
                value={endReason}
                onChange={(e) => {
                  setEndReason(e.target.value);
                  clearErr("endReason");
                }}
                placeholder="سبب إنهاء أو إلغاء الرحلة…"
                dir="rtl"
              />
              {errors.endReason && (
                <span style={errorTextStyle}>{errors.endReason}</span>
              )}
            </label>
          </div>

          {/* reason — edit only (for reassigning driver/car) */}
          {!isNew && (
            <>
              <p style={sectionHeadingStyle}>سجل التغيير</p>
              <label style={labelStyle}>
                سبب التعديل{" "}
                <span style={optionalLabelStyle}>
                  (مطلوب عند تغيير السائق أو السيارة)
                </span>
                <input
                  style={inputBase}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: تغيير السائق بسبب إجازة طارئة"
                  dir="rtl"
                />
              </label>
            </>
          )}

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
                  ? "إضافة الرحلة"
                  : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
