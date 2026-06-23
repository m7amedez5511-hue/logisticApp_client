"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Spinner } from "@/src/Components/UI";
import { RoleToast } from "@/src/Components/role/RoleToast";
import { useRoles } from "@/src/hooks/useRole";
import type { Role, Permission } from "@/src/services/role.service";

// ── Module label map ───────────────────────────────────────────────────────
const MODULE_LABELS: Record<string, string> = {
  Role: "الأدوار", User: "المستخدمون", Branch: "الفروع",
  Car: "المركبات", CarImage: "صور المركبات", Driver: "السائقون",
  Order: "الطلبات", Trip: "الرحلات", Client: "العملاء",
  Permission: "الصلاحيات", Audit: "سجل التدقيق",
  Dashboard: "لوحة التحكم", Maintenance: "الصيانة",
};
const moduleLabel = (mod: string) => MODULE_LABELS[mod] ?? mod;

function groupByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module || "أخرى"] ??= []).push(p);
    return acc;
  }, {});
}

// ── Permission Matrix ──────────────────────────────────────────────────────

function PermissionMatrix({
  role,
  allPermissions,
  onSave,
}: {
  role: Role;
  allPermissions: Permission[];
  onSave: (roleId: string, permIds: string[]) => Promise<boolean>;
}) {
  const currentIds = role.permissions?.map(rp => rp.permission.id) ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const grouped = groupByModule(allPermissions);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSaved(false);
  };

  const toggleModule = (mod: string) => {
    const ids = (grouped[mod] ?? []).map(p => p.id);
    const allChecked = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      allChecked ? ids.forEach(id => next.delete(id)) : ids.forEach(id => next.add(id));
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(role.id, [...selected]);
    setSaving(false);
    if (ok) setSaved(true);
  };

  return (
    <div style={{
      borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
      background: "var(--color-surface)", boxShadow: "var(--shadow-card)", overflow: "hidden",
    }}>
      {/* Role header */}
      <div style={{
        padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface-muted)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{role.name}</p>
          {role.description && (
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{role.description}</p>
          )}
          <p style={{ fontSize: 11, color: "var(--color-text-hint)", marginTop: 4 }}>
            {selected.size} من {allPermissions.length} صلاحية مفعّلة
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && (
            <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>✓ تم الحفظ</span>
          )}
          <button type="button" onClick={handleSave} disabled={saving}
            style={{
              height: 36, padding: "0 1.25rem", borderRadius: "var(--radius-md)",
              border: "none", background: saving ? "var(--color-brand-400)" : "var(--color-brand-600)",
              fontSize: 13, fontWeight: 700, color: "#FFF",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)",
            }}>
            {saving && <Spinner size="sm" className="text-white" />}
            {saving ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>

      {/* Module rows */}
      <div style={{ padding: "0.75rem" }}>
        {Object.entries(grouped).map(([mod, perms]) => {
          const allChecked = perms.every(p => selected.has(p.id));
          const someChecked = !allChecked && perms.some(p => selected.has(p.id));
          return (
            <div key={mod} style={{ marginBottom: "0.5rem" }}>
              {/* Module header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.5rem 0.75rem",
                background: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                marginBottom: "0.375rem",
              }}>
                <input type="checkbox" checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked; }}
                  onChange={() => toggleModule(mod)}
                  style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#2563EB" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {moduleLabel(mod)}
                </span>
                <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginRight: "auto" }}>
                  {perms.filter(p => selected.has(p.id)).length}/{perms.length}
                </span>
              </div>
              {/* Permissions */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", paddingRight: "1.5rem" }}>
                {perms.map(perm => {
                  const checked = selected.has(perm.id);
                  return (
                    <label key={perm.id} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "0.3rem 0.625rem",
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${checked ? "#BFDBFE" : "var(--color-border)"}`,
                      background: checked ? "#EFF6FF" : "var(--color-surface-muted)",
                      cursor: "pointer", userSelect: "none",
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => toggle(perm.id)}
                        style={{ width: 13, height: 13, cursor: "pointer", accentColor: "#2563EB" }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: checked ? "#1D4ED8" : "var(--color-text-primary)" }}>
                        {perm.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RolePermissionPage() {
  const { roles, loading, error, permissions, clearError, updateRolePermissionsBulk, notification } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null;

  const handleSave = useCallback(async (roleId: string, permIds: string[]): Promise<boolean> => {
    return updateRolePermissionsBulk(roleId, permIds);
  }, [updateRolePermissionsBulk]);

  return (
    <>
      <RoleToast notification={notification} />

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <header style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: "1.5rem 2rem", boxShadow: "var(--shadow-card)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة الصلاحيات
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                مصفوفة الصلاحيات
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إدارة صلاحيات كل دور بشكل مجمَّع
              </p>
            </div>
            <div style={{ minWidth: 240 }}>
              <select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)} dir="rtl"
                style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, color: "var(--color-text-primary)", outline: "none", fontFamily: "var(--font-sans)" }}>
                <option value="">اختر دوراً لتعديل صلاحياته</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
        </header>

        {error && <Alert type="error" message={error} onClose={clearError} />}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        ) : !selectedRole ? (
          <div style={{
            borderRadius: "var(--radius-xl)", border: "2px dashed var(--color-border)",
            background: "var(--color-surface)", padding: "4rem 2rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 32, margin: 0 }}>🔐</p>
            <p style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
              اختر دوراً من القائمة أعلاه
            </p>
            <p style={{ marginTop: 4, fontSize: 13, color: "var(--color-text-muted)" }}>
              ستظهر هنا صلاحيات الدور المحدد وبإمكانك تعديلها مباشرة.
            </p>
          </div>
        ) : (
          <PermissionMatrix
            key={selectedRole.id}
            role={selectedRole}
            allPermissions={permissions}
            onSave={handleSave}
          />
        )}
      </section>
    </>
  );
}