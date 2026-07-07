"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Spinner } from "../UI";
import {
  createClientSchema,
  updateClientSchema,
  CLIENT_TYPES,
} from "@/src/validations/client.validator";
import type { Client, ClientFormData } from "@/src/types/client";

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
};

const withError = (hasError: boolean): React.CSSProperties => ({
  ...S.input,
  ...(hasError ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
});

// ── Props ──────────────────────────────────────────────────────────────────
interface ClientFormModalProps {
  editClient: Client | null;
  onClose:   () => void;
  onSubmit:  (
    data: ClientFormData,
    isNew: boolean
  ) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ClientFormModal({ editClient, onClose, onSubmit }: ClientFormModalProps) {
  const isNew = editClient === null;

  // FIX 1: was `Schema` (capital S) — now correctly `schema`
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: yupResolver(isNew ? createClientSchema : updateClientSchema) as never,
    defaultValues: {
      name: editClient?.name ?? "",
      email: editClient?.email ?? "",
      phone: editClient?.phone ?? "",
      clientType: editClient?.clientType ?? undefined,
      isActive: editClient?.isActive ?? true,
    },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const submitHandler = async (data: ClientFormData) => {
    const ok = await onSubmit(data, isNew);
    if (ok) {
      onClose();
    } else {
      setError("name", { message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً." });
    }
  };

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
          onSubmit={handleSubmit(submitHandler)}
          noValidate
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {errors.name?.type === "manual" && (
            <Alert type="error" message={errors.name.message ?? ""} onClose={() => {}} />
          )}

          <label style={S.label}>
            اسم العميل {isNew && "*"}
            <input
              {...register("name")}
              style={withError(!!errors.name)}
              placeholder="شركة لوجي فلو للتوصيل"
              autoComplete="organization"
              dir="rtl"
            />
            {errors.name && errors.name.type !== "manual" && (
              <span style={S.errorText}>{errors.name.message}</span>
            )}
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <label style={S.label}>
              البريد الإلكتروني
              <input
                {...register("email")}
                style={withError(!!errors.email)}
                type="email"
                placeholder="info@company.sa"
                autoComplete="email"
                dir="ltr"
              />
              {errors.email && (
                <span style={S.errorText}>{errors.email.message}</span>
              )}
            </label>

            <label style={S.label}>
              رقم الهاتف {isNew && "*"}
              <input
                {...register("phone")}
                style={withError(!!errors.phone)}
                type="tel"
                placeholder="05xxxxxxxx"
                autoComplete="tel"
                dir="ltr"
              />
              {errors.phone && (
                <span style={S.errorText}>{errors.phone.message}</span>
              )}
            </label>
          </div>

          <label style={S.label}>
            نوع العميل
            <select
              {...register("clientType")}
              style={{ ...withError(!!errors.clientType), cursor: "pointer" }}
              dir="rtl"
            >
              <option value="">اختر النوع</option>
              {CLIENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "Individual" ? "فرد" : "شركة"}
                </option>
              ))}
            </select>
            {errors.clientType && (
              <span style={S.errorText}>{errors.clientType.message}</span>
            )}
          </label>

          {!isNew && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                {...register("isActive" as never)}
                defaultChecked={editClient?.isActive ?? true}
                style={{ width: 14, height: 14, cursor: "pointer" }}
              />
              عميل نشط
            </label>
          )}

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
              {isSubmitting ? "جارٍ الحفظ…" : isNew ? "إضافة العميل" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}