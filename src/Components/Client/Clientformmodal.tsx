"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Spinner } from "../UI";
import type { Client, ClientFormData, ClientFormErrors } from "@/src/types/client";

// ── Fixed styles (same token system as UserFormModal) ──────────────────────
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,15}$/;

function validate(data: ClientFormData): ClientFormErrors {
  const e: ClientFormErrors = {};
  if (!data.name.trim())  e.name  = "اسم العميل مطلوب";
  if (!data.email.trim()) {
    e.email = "البريد الإلكتروني مطلوب";
  } else if (!EMAIL_RE.test(data.email)) {
    e.email = "صيغة البريد الإلكتروني غير صحيحة";
  }
  if (!data.phone.trim()) {
    e.phone = "رقم الهاتف مطلوب";
  } else if (!PHONE_RE.test(data.phone.replace(/\s/g, ""))) {
    e.phone = "رقم هاتف غير صالح (10–15 رقم)";
  }
  return e;
}

// ── Props ──────────────────────────────────────────────────────────────────
interface ClientFormModalProps {
  editClient: Client | null;   // null = create mode, Client = edit mode
  onClose:   () => void;
  onSubmit:  (data: ClientFormData, isNew: boolean) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ClientFormModal({
  editClient,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  const isNew = editClient === null;

  const [form, setForm] = useState<ClientFormData>({
    name:  editClient?.name  ?? "",
    email: editClient?.email ?? "",
    phone: editClient?.phone ?? "",
    taxId: editClient?.taxId ?? "",
    notes: editClient?.notes ?? "",
  });
  const [errors,   setErrors]   = useState<ClientFormErrors>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");
  const firstInputRef           = useRef<HTMLInputElement>(null);

  useEffect(() => { firstInputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (field: keyof ClientFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
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

  const inputStyle = (field: keyof ClientFormErrors): React.CSSProperties => ({
    ...S.input,
    ...(errors[field] ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
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
              {isNew ? "إضافة عميل" : "تعديل عميل"}
            </p>
            <h2
              id="client-modal-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "4px 0 0",
              }}
            >
              {isNew ? "عميل جديد" : editClient?.name}
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

          {/* Name */}
          <label style={S.label}>
            اسم العميل *
            <input
              ref={firstInputRef}
              style={inputStyle("name")}
              value={form.name}
              onChange={set("name")}
              placeholder="شركة لوجي فلو للتوصيل"
              autoComplete="organization"
              dir="rtl"
            />
            {errors.name && <span style={S.errorText}>{errors.name}</span>}
          </label>

          {/* Email + Phone */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={S.label}>
              البريد الإلكتروني *
              <input
                style={inputStyle("email")}
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="info@company.sa"
                autoComplete="email"
                dir="ltr"
              />
              {errors.email && <span style={S.errorText}>{errors.email}</span>}
            </label>
            <label style={S.label}>
              رقم الهاتف *
              <input
                style={inputStyle("phone")}
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+966 5x xxx xxxx"
                autoComplete="tel"
                dir="ltr"
              />
              {errors.phone && <span style={S.errorText}>{errors.phone}</span>}
            </label>
          </div>

          {/* Tax ID */}
          <label style={S.label}>
            الرقم الضريبي (اختياري)
            <input
              style={S.input}
              value={form.taxId}
              onChange={set("taxId")}
              placeholder="300xxxxxxxxx"
              dir="ltr"
            />
          </label>

          {/* Notes */}
          <label style={S.label}>
            ملاحظات (اختياري)
            <textarea
              style={{
                ...S.input,
                height: 80,
                padding: "0.5rem 0.75rem",
                resize: "vertical",
              }}
              value={form.notes}
              onChange={set("notes")}
              placeholder="أي معلومات إضافية عن العميل…"
              dir="rtl"
            />
          </label>

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
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة العميل" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}