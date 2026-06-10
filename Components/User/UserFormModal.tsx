"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Spinner } from "../UI";
import type { Branch } from "../../types/branch";
import type { Role } from "../../types/role";
import type { FormErrors, User, UserFormData } from "../../types/user";

// ── fixed styles ─────────────────────────────────────────────────
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

// ── macksure data validation ─────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,15}$/;

function validate(data: UserFormData, isNew: boolean): FormErrors {
  const e: FormErrors = {};
  if (!data.name.trim())  e.name = "الاسم الكامل مطلوب";
  if (data.email && !EMAIL_RE.test(data.email)) e.email = "صيغة البريد الإلكتروني غير صحيحة";
  if (!data.phone.trim()) e.phone = "رقم الهاتف مطلوب";
  else if (!PHONE_RE.test(data.phone.replace(/\s/g, ""))) e.phone = "رقم هاتف غير صالح (10–15 رقم)";
  if (isNew && !data.password) e.password = "كلمة المرور مطلوبة";
  if (isNew && data.password && data.password.length < 6) e.password = "كلمة المرور 6 أحرف على الأقل";
  if (!data.roleId)   e.roleId   = "الدور مطلوب";
  if (!data.branchId) e.branchId = "الفرع مطلوب";
  return e;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface UserFormModalProps {
  editUser:  User | null;        
  roles:     Role[];
  branches:  Branch[];
  onClose:   () => void;
  onSubmit:  (data: UserFormData, isNew: boolean) => Promise<boolean>;
}

// ── main component ────────────────────────────────────────────────────────────
export function UserFormModal({ editUser, roles, branches, onClose, onSubmit }: UserFormModalProps) {
  const isNew = editUser === null;

  const [form, setForm] = useState<UserFormData>({
    name:     editUser?.name     ?? "",
    email:    editUser?.email    ?? "",
    phone:    editUser?.phone    ?? "",
    password: "",
    roleId:   editUser?.role?.id ?? "",
    branchId: editUser?.branch?.id ?? "",
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

  const set = (field: keyof UserFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // makesure data is valid before sending to API
    const errs = validate(form, isNew);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    // final check to prevent sending bad data to API (shouldn't happen because of validation, but just in case)
    if (!form.name.trim() || !form.phone.trim() || !form.roleId || !form.branchId) {
      setApiError("يرجى التأكد من إدخال جميع البيانات المطلوبة.");
      return;
    }
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
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
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
          width: "100%", maxWidth: 520,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
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
              {isNew ? "إضافة مستخدم" : "تعديل مستخدم"}
            </p>
            <h2 id="modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {isNew ? "مستخدم جديد" : editUser?.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* body*/}
        <form onSubmit={handleSubmit} noValidate style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {apiError && <Alert type="error" message={apiError} onClose={() => setApiError("")} />}

          {/* name field*/}
          <label style={S.label}>
            الاسم الكامل *
            <input ref={firstInputRef} style={inputStyle("name")} value={form.name} onChange={set("name")} placeholder="أحمد الرشيدي" autoComplete="name" dir="rtl" />
            {errors.name && <span style={S.errorText}>{errors.name}</span>}
          </label>

          {/* email and phone fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              البريد الإلكتروني
              <input style={inputStyle("email")} type="email" value={form.email} onChange={set("email")} placeholder="ahmed@co.sa" autoComplete="email" dir="ltr" />
              {errors.email && <span style={S.errorText}>{errors.email}</span>}
            </label>
            <label style={S.label}>
              رقم الهاتف *
              <input style={inputStyle("phone")} type="tel" value={form.phone} onChange={set("phone")} placeholder="+966 5x xxx xxxx" autoComplete="tel" dir="ltr" />
              {errors.phone && <span style={S.errorText}>{errors.phone}</span>}
            </label>
          </div>

          {/* password field */}
          <label style={S.label}>
            {isNew ? "كلمة المرور *" : "كلمة المرور الجديدة (اتركها فارغة إذا لا تريد تغييرها)"}
            <input style={inputStyle("password")} type="password" value={form.password} onChange={set("password")} placeholder="••••••••" autoComplete={isNew ? "new-password" : "off"} dir="ltr" />
            {errors.password && <span style={S.errorText}>{errors.password}</span>}
          </label>

          {/* role and branch fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <label style={S.label}>
              الدور *
              <select style={{ ...inputStyle("roleId"), cursor: "pointer" }} value={form.roleId} onChange={set("roleId")} dir="rtl">
                <option value="">اختر الدور</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.roleId && <span style={S.errorText}>{errors.roleId}</span>}
            </label>
            <label style={S.label}>
              الفرع *
              <select style={{ ...inputStyle("branchId"), cursor: "pointer" }} value={form.branchId} onChange={set("branchId")} dir="rtl">
                <option value="">اختر الفرع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.branchId && <span style={S.errorText}>{errors.branchId}</span>}
            </label>
          </div>

          {/* action buttons */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
              إلغاء
            </button>
            <button type="submit" disabled={saving}
              style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إضافة المستخدم" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}