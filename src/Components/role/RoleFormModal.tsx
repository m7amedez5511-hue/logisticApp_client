"use client";

import { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { Alert, Spinner } from "../UI";
import { createRoleSchema, updateRoleSchema, type RoleFormErrors } from "@/src/validations/role.validator";
import { Permission, Role, RoleFormData } from "@/src/types/role";

// ── Styles ────────────────────────────────────────────────────────────────────
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

// ── Validation ────────────────────────────────────────────────────────────────
async function validate(data: RoleFormData, isNew: boolean): Promise<RoleFormErrors> {
  const schema = isNew ? createRoleSchema : updateRoleSchema;
  try {
    await schema.validate(data, { abortEarly: false });
    return {};
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      return err.inner.reduce<RoleFormErrors>((acc, e) => {
        const field = e.path as keyof RoleFormErrors;
        if (field && !acc[field]) acc[field] = e.message;
        return acc;
      }, {});
    }
    return {};
  }
}

// ── Permission checkbox group ─────────────────────────────────────────────────
/*function PermissionGroup({
  module, perms, selected, onToggle,
}: {
  module: string; perms: Permission[]; selected: string[]; onToggle: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)", margin: "0 0 6px" }}>
        {module}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {perms.map(p => {
          const checked = selected.includes(p.id);
          return (
            <label key={p.id} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0.3rem 0.6rem", borderRadius: "var(--radius-md)",
              border: `1px solid ${checked ? "#BFDBFE" : "var(--color-border)"}`,
              background: checked ? "#EFF6FF" : "var(--color-surface-muted)",
              cursor: "pointer", fontSize: 12, fontWeight: 500,
              color: checked ? "#1D4ED8" : "var(--color-text-secondary)",
              transition: "all 150ms",
            }}>
              <input
                type="checkbox" checked={checked} onChange={() => onToggle(p.id)}
                style={{ accentColor: "#2563EB", cursor: "pointer" }}
              />
              {p.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}*/

// ── Props ─────────────────────────────────────────────────────────────────────
interface RoleFormModalProps {
  editRole:    Role | null;
  permissions: Permission[];
  onClose:     () => void;
  onSubmit:    (data: RoleFormData, isNew: boolean) => Promise<boolean>;
}

// ── Main component ────────────────────────────────────────────────────────────
export function RoleFormModal({ editRole, permissions, onClose, onSubmit }: RoleFormModalProps) {
  const isNew = editRole === null;

  // Group permissions by module
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const currentPermIds = editRole?.permissions?.map(p => p.permission.id) ?? [];

  const [form, setForm] = useState<RoleFormData>({
    name:          editRole?.name        ?? "",
    description:   editRole?.description ?? "",
    permissionIds: currentPermIds,
  });
  const [errors,   setErrors]   = useState<RoleFormErrors>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");
  const firstInputRef           = useRef<HTMLInputElement>(null);

  useEffect(() => { firstInputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (field: keyof Pick<RoleFormData, "name" | "description">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
    };

  const togglePerm = (id: string) => {
    setForm(p => ({
      ...p,
      permissionIds: p.permissionIds.includes(id)
        ? p.permissionIds.filter(x => x !== id)
        : [...p.permissionIds, id],
    }));
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

  const inputStyle = (field: keyof RoleFormErrors): React.CSSProperties => ({
    ...S.input,
    ...(errors[field] ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
  });

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="role-modal-title"
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
          width: "100%", maxWidth: 600,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden", display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
              {isNew ? "إضافة دور" : "تعديل دور"}
            </p>
            <h2 id="role-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {isNew ? "دور جديد" : editRole?.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit} noValidate
          style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1 }}
        >
          {apiError && <Alert type="error" message={apiError} onClose={() => setApiError("")} />}

          {/* Name */}
          <label style={S.label} dir="rtl">
            اسم الدور *
            <input ref={firstInputRef} style={inputStyle("name")} value={form.name} onChange={set("name")} placeholder="مثال: مدير الفروع" dir="rtl" />
            {errors.name && <span style={S.errorText}>{errors.name}</span>}
          </label>

          {/* Description */}
          <label style={S.label} dir="rtl">
            الوصف
            <textarea
              style={{
                ...S.input, height: "auto", padding: "0.5rem 0.75rem", resize: "none",
                ...(errors.description ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
              } as React.CSSProperties}
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="وصف مختصر لمهام هذا الدور…"
              dir="rtl"
            />
            {errors.description && <span style={S.errorText}>{errors.description}</span>}
          </label>

          {/* Permissions */}
          {/*{permissions.length > 0 && (
            <div dir="rtl">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  الصلاحيات
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setForm(p => ({ ...p, permissionIds: permissions.map(x => x.id) }))}
                    style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    تحديد الكل
                  </button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, permissionIds: [] }))}
                    style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    إلغاء الكل
                  </button>
                </div>
              </div>
              <div style={{
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                padding: "0.875rem", background: "var(--color-surface-muted)",
                maxHeight: 280, overflowY: "auto",
              }}>
                {Object.entries(grouped).map(([module, perms]) => (
                  <PermissionGroup
                    key={module} module={module} perms={perms}
                    selected={form.permissionIds} onToggle={togglePerm}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
                {form.permissionIds.length} صلاحية محددة من أصل {permissions.length}
              </p>
            </div>
          )}*/}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem", flexShrink: 0 }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)" }}>
              إلغاء
            </button>
            <button type="submit" disabled={saving}
              style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إنشاء الدور" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}