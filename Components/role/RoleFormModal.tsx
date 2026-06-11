"use client";


import { useEffect, useRef, useState } from "react";
import { Alert, Spinner } from "../UI";
import type { Role, RoleFormData, Permission } from "../../services/role.service";

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
  errorText: {
    fontSize: 11, color: "var(--color-danger)", fontWeight: 500,
  } as React.CSSProperties,
};

// ── Module label map (Arabic) ─────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  Role:        "الأدوار",
  User:        "المستخدمون",
  Branch:      "الفروع",
  Car:         "المركبات",
  CarImage:    "صور المركبات",
  Driver:      "السائقون",
  Order:       "الطلبات",
  Trip:        "الرحلات",
  Client:      "العملاء",
  Permission:  "الصلاحيات",
  Audit:       "سجل التدقيق",
  Dashboard:   "لوحة التحكم",
  Maintenance: "الصيانة",
};

const moduleLabel = (mod: string) => MODULE_LABELS[mod] ?? mod;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Group permissions by their module field */
function groupByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const key = p.module || "أخرى";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
}

interface FormErrors {
  name?: string;
}

function validate(name: string): FormErrors {
  const e: FormErrors = {};
  if (!name.trim()) e.name = "اسم الدور مطلوب";
  else if (name.trim().length < 2) e.name = "الاسم يجب أن يكون حرفين على الأقل";
  return e;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RoleFormModalProps {
  editRole:     Role | null;          // null = create mode
  permissions:  Permission[];         // all available permissions
  onClose:      () => void;
  onSubmit:     (data: RoleFormData, currentPermIds: string[]) => Promise<boolean>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RoleFormModal({ editRole, permissions, onClose, onSubmit }: RoleFormModalProps) {
  const isNew = editRole === null;

  // Current permission IDs attached to the role being edited
  const currentPermIds = editRole?.permissions?.map(rp => rp.permission.id) ?? [];

  const [name, setName]               = useState(editRole?.name ?? "");
  const [description, setDescription] = useState(editRole?.description ?? "");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set(currentPermIds));
  const [errors, setErrors]           = useState<FormErrors>({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState("");
  const [searchPerm, setSearchPerm]   = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const firstInputRef = useRef<HTMLInputElement>(null);

  const grouped = groupByModule(permissions);

  // Auto-expand modules that have selected permissions or match search
  useEffect(() => {
    if (editRole) {
      const modulesWithSelected = new Set<string>();
      permissions.forEach(p => {
        if (currentPermIds.includes(p.id)) modulesWithSelected.add(p.module);
      });
      setExpandedModules(modulesWithSelected);
    }
    firstInputRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard: Escape closes
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Checkbox helpers ───────────────────────────────────────────────────────

  const togglePerm = (id: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    const modulePerms = (grouped[module] ?? []).map(p => p.id);
    const allSelected = modulePerms.every(id => selectedPerms.has(id));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (allSelected) modulePerms.forEach(id => next.delete(id));
      else modulePerms.forEach(id => next.add(id));
      return next;
    });
  };

  const toggleExpandModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const selectAll = () => setSelectedPerms(new Set(permissions.map(p => p.id)));
  const clearAll  = () => setSelectedPerms(new Set());

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(name);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError("");
    const ok = await onSubmit(
      { name: name.trim(), description: description.trim(), permissionIds: [...selectedPerms] },
      currentPermIds,
    );
    setSaving(false);
    if (ok) onClose();
    else setApiError("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
  };

  // ── Filter permissions by search ───────────────────────────────────────────

  const filteredGrouped = Object.entries(grouped).reduce<Record<string, Permission[]>>((acc, [mod, perms]) => {
    if (!searchPerm.trim()) {
      acc[mod] = perms;
    } else {
      const q = searchPerm.trim().toLowerCase();
      const filtered = perms.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q)
      );
      if (filtered.length) acc[mod] = filtered;
    }
    return acc;
  }, {});

  const totalSelected = selectedPerms.size;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
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
          width: "100%", maxWidth: 640,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* ── Modal header ── */}
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
              {isNew ? "دور جديد" : editRole.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)", cursor: "pointer",
              fontSize: 18, color: "var(--color-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto", flex: 1 }}
        >
          {apiError && <Alert type="error" message={apiError} onClose={() => setApiError("")} />}

          {/* Name field */}
          <label style={S.label}>
            اسم الدور *
            <input
              ref={firstInputRef}
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors({}); }}
              placeholder="مدير النظام"
              autoComplete="off"
              dir="rtl"
              style={{
                ...S.input,
                ...(errors.name ? { borderColor: "var(--color-danger)", background: "#FEF2F2" } : {}),
              }}
            />
            {errors.name && <span style={S.errorText}>{errors.name}</span>}
          </label>

          {/* Description field */}
          <label style={S.label}>
            الوصف (اختياري)
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="وصف مختصر لمهام هذا الدور…"
              rows={2}
              dir="rtl"
              style={{
                ...S.input,
                height: "auto",
                padding: "0.5rem 0.75rem",
                resize: "vertical",
                minHeight: 60,
              }}
            />
          </label>

          {/* ── Permissions section ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", margin: 0 }}>
                  الصلاحيات
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                  {totalSelected} من {permissions.length} صلاحية محددة
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={selectAll}
                  style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", background: "var(--color-brand-50)", border: "1px solid var(--color-brand-200)", borderRadius: "var(--radius-md)", padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                  تحديد الكل
                </button>
                <button type="button" onClick={clearAll}
                  style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", background: "var(--color-surface-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                  إلغاء الكل
                </button>
              </div>
            </div>

            {/* Permission search */}
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--color-text-hint)", pointerEvents: "none" }}
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="بحث في الصلاحيات…"
                value={searchPerm}
                onChange={e => setSearchPerm(e.target.value)}
                dir="rtl"
                style={{
                  ...S.input,
                  paddingRight: 30, height: 36, fontSize: 12,
                }}
              />
            </div>

            {/* Grouped permission modules */}
            {permissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                جارٍ تحميل الصلاحيات…
              </div>
            ) : Object.keys(filteredGrouped).length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem", fontSize: 12, color: "var(--color-text-muted)" }}>
                لا توجد نتائج لـ &quot;{searchPerm}&quot;
              </div>
            ) : (
              <div style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}>
                {Object.entries(filteredGrouped).map(([mod, perms], idx) => {
                  const allChecked = perms.every(p => selectedPerms.has(p.id));
                  const someChecked = !allChecked && perms.some(p => selectedPerms.has(p.id));
                  const isExpanded = expandedModules.has(mod) || !!searchPerm;
                  const checkedCount = perms.filter(p => selectedPerms.has(p.id)).length;

                  return (
                    <div key={mod} style={{ borderBottom: idx < Object.keys(filteredGrouped).length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      {/* Module header row */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "0.625rem 1rem",
                        background: isExpanded ? "var(--color-surface-muted)" : "var(--color-surface)",
                        cursor: "pointer",
                        transition: "background 150ms",
                      }}>
                        {/* Module checkbox (select/deselect all in module) */}
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={el => { if (el) el.indeterminate = someChecked; }}
                          onChange={() => toggleModule(mod)}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 15, height: 15, cursor: "pointer", flexShrink: 0, accentColor: "#2563EB" }}
                        />
                        {/* Module name */}
                        <button
                          type="button"
                          onClick={() => toggleExpandModule(mod)}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>
                            {moduleLabel(mod)}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {checkedCount > 0 && (
                              <span style={{
                                fontSize: 10, fontWeight: 700,
                                color: "#2563EB",
                                background: "var(--color-brand-50)",
                                border: "1px solid var(--color-brand-200)",
                                borderRadius: "var(--radius-full)",
                                padding: "1px 7px",
                              }}>
                                {checkedCount}/{perms.length}
                              </span>
                            )}
                            <svg
                              style={{
                                width: 14, height: 14,
                                color: "var(--color-text-muted)",
                                transform: isExpanded ? "rotate(180deg)" : "none",
                                transition: "transform 200ms",
                              }}
                              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                            >
                              <path d="m6 9 6 6 6-6"/>
                            </svg>
                          </div>
                        </button>
                      </div>

                      {/* Permissions grid */}
                      {isExpanded && (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                          gap: "0.5rem",
                          padding: "0.75rem 1rem 0.875rem",
                          background: "var(--color-surface)",
                        }}>
                          {perms.map(perm => {
                            const checked = selectedPerms.has(perm.id);
                            return (
                              <label
                                key={perm.id}
                                style={{
                                  display: "flex", alignItems: "flex-start", gap: 8,
                                  padding: "0.5rem 0.625rem",
                                  borderRadius: "var(--radius-md)",
                                  border: `1px solid ${checked ? "#BFDBFE" : "var(--color-border)"}`,
                                  background: checked ? "#EFF6FF" : "var(--color-surface-muted)",
                                  cursor: "pointer",
                                  transition: "all 150ms",
                                  userSelect: "none",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePerm(perm.id)}
                                  style={{ width: 14, height: 14, marginTop: 1, cursor: "pointer", flexShrink: 0, accentColor: "#2563EB" }}
                                />
                                <div>
                                  <p style={{ fontSize: 11, fontWeight: 600, color: checked ? "#1D4ED8" : "var(--color-text-primary)", margin: 0, lineHeight: 1.4 }}>
                                    {perm.name}
                                  </p>
                                  <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                                    {perm.slug}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.25rem", flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                height: 40, padding: "0 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, fontWeight: 600,
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
                height: 40, padding: "0 1.5rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)",
                fontSize: 13, fontWeight: 700,
                color: "#FFF",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-sans)",
              }}
            >
              {saving && <Spinner size="sm" className="text-white" />}
              {saving ? "جارٍ الحفظ…" : isNew ? "إنشاء الدور" : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}