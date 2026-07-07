"use client";

import { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { Alert, Spinner } from "../UI";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from "@/src/validations/carMaintanance.validator";
import type {
  CarMaintenance,
  CreateMaintenancePayload,
  MaintenanceFormErrors,
  UpdateMaintenancePayload,
} from "@/src/types/carMaintanance";

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

// ── Number coercion helper ────────────────────────────────────────────────────
// The backend can return `cost` as a numeric string (common with Decimal
// columns getting JSON-serialized as strings), even though our TS type says
// `number`. If that untouched value round-trips back out on update without
// ever passing through the `<input type="number">` onChange handler, it
// stays a string and fails the backend's strict `z.number()` check. Coerce
// defensively both when hydrating the form AND right before building the
// submit payload, so this can never happen regardless of the source.

function toNumberOrUndefined(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? undefined : n;
}

// ── yup validation ────────────────────────────────────────────────────────────
// Checks the form values against the right schema and turns any problems
// into a simple field -> message map the inputs below can read from.

async function validate(
  form: Partial<CreateMaintenancePayload>,
  isNew: boolean,
): Promise<MaintenanceFormErrors> {
  const schema = isNew ? createMaintenanceSchema : updateMaintenanceSchema;
  try {
    await schema.validate(form, { abortEarly: false });
    return {};
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return err.inner.reduce<MaintenanceFormErrors>((acc, e) => {
        const field = e.path as keyof MaintenanceFormErrors;
        if (field && !acc[field]) acc[field] = e.message;
        return acc;
      }, {});
    }
    return {};
  }
}

// ── Date helper ───────────────────────────────────────────────────────────────
// <input type="date"> gives "YYYY-MM-DD"; the backend expects full ISO-8601.

function toIsoDateTime(val: string): string {
  if (!val) return val;
  if (val.includes("T")) return val;
  return `${val}T00:00:00.000Z`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarMaintenanceFormModalProps {
  /** Pass null to create a brand new record, or an existing record to edit it. */
  editRecord: CarMaintenance | null;
  /** Shown in the header so the person knows which car this belongs to. */
  carLabel?: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateMaintenancePayload | UpdateMaintenancePayload,
    isNew: boolean,
  ) => Promise<boolean>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarMaintenanceFormModal({
  editRecord,
  carLabel,
  onClose,
  onSubmit,
}: CarMaintenanceFormModalProps) {
  const isNew = editRecord === null;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [reason, setReason]   = useState(editRecord?.reason ?? "");
  // Coerced defensively: editRecord.cost may arrive as a numeric string from
  // the backend (e.g. a Decimal column serialized to JSON as "150").
  const [cost, setCost]       = useState<number | undefined>(toNumberOrUndefined(editRecord?.cost));
  const [startAt, setStartAt] = useState(editRecord?.startAt?.slice(0, 10) ?? "");
  const [endAt, setEndAt]     = useState(editRecord?.endAt?.slice(0, 10) ?? "");

  const [errors, setErrors]     = useState<MaintenanceFormErrors>({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const parseNum = (v: string): number | undefined =>
    v.trim() === "" ? undefined : Number(v);

  const inputStyle = (field: keyof MaintenanceFormErrors): React.CSSProperties => ({
    ...inputBase,
    ...(errors[field] ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
  });

  const clearFieldError = (field: keyof MaintenanceFormErrors) =>
    setErrors((p) => ({ ...p, [field]: undefined }));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Belt-and-braces: re-coerce cost right before it's used, in case it
    // somehow slipped back into a string (e.g. untouched value hydrated
    // from a record whose `cost` came back as a numeric string).
    const safeCost = toNumberOrUndefined(cost);

    // Build a snapshot for yup — include everything so optional rules also run.
    const formSnapshot: Partial<CreateMaintenancePayload> = {
      reason,
      cost: safeCost,
      ...(startAt && { startAt }),
      ...(endAt && { endAt }),
    };

    const errs = await validate(formSnapshot, isNew);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    // Build the final payload — dates go out as full ISO-8601 strings, and
    // cost always goes out as a real number, never a string.
    const raw: Record<string, unknown> = { reason, cost: safeCost };
    if (startAt) raw.startAt = toIsoDateTime(startAt);
    if (endAt) raw.endAt = toIsoDateTime(endAt);

    const payload = raw as unknown as CreateMaintenancePayload;
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
      aria-labelledby="maintenance-modal-title"
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
          width: "100%", maxWidth: 520,
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
              {isNew ? "إضافة سجل صيانة" : "تعديل سجل صيانة"}
            </p>
            <h2 id="maintenance-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {carLabel ?? (isNew ? "سجل صيانة جديد" : "تعديل السجل")}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "75vh", overflowY: "auto" }}
          dir="rtl"
        >
          {apiError && <Alert type="error" message={apiError} onClose={() => setApiError("")} />}

          <label style={labelStyle}>
            سبب الصيانة *
            <input
              ref={firstRef}
              style={inputStyle("reason")}
              value={reason}
              onChange={(e) => { setReason(e.target.value); clearFieldError("reason"); }}
              placeholder="تغيير زيت المحرك"
              dir="rtl"
            />
            {errors.reason && <span style={errorTextStyle}>{errors.reason}</span>}
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={labelStyle}>
              التكلفة (ر.س) *
              <input
                style={inputStyle("cost")}
                type="number"
                min={0}
                value={cost ?? ""}
                onChange={(e) => { setCost(parseNum(e.target.value)); clearFieldError("cost"); }}
                placeholder="0"
                dir="ltr"
              />
              {errors.cost && <span style={errorTextStyle}>{errors.cost}</span>}
            </label>

            <label style={labelStyle}>
              تاريخ البدء *
              <input
                style={inputStyle("startAt")}
                type="date"
                value={startAt}
                onChange={(e) => { setStartAt(e.target.value); clearFieldError("startAt"); }}
              />
              {errors.startAt && <span style={errorTextStyle}>{errors.startAt}</span>}
            </label>
          </div>

          <label style={labelStyle}>
            تاريخ الانتهاء
            <input
              style={inputStyle("endAt")}
              type="date"
              value={endAt}
              onChange={(e) => { setEndAt(e.target.value); clearFieldError("endAt"); }}
            />
            {errors.endAt && <span style={errorTextStyle}>{errors.endAt}</span>}
            <span style={{ fontSize: 11, color: "var(--color-text-hint)", fontWeight: 400 }}>
              اتركه فارغاً إذا كانت الصيانة ما زالت جارية.
            </span>
          </label>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{ height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)" }}
            >
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة السجل" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}