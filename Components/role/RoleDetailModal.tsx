"use client";

import { useState } from "react";
import { Alert, Spinner } from "../UI";
import type { Role, Permission } from "../../services/role.service";

const MODULE_LABELS: Record<string, string> = {
  Role: "الأدوار",
  User: "المستخدمون",
  Branch: "الفروع",
  Car: "المركبات",
  CarImage: "صور المركبات",
  Driver: "السائقون",
  Order: "الطلبات",
  Trip: "الرحلات",
  Client: "العملاء",
  Permission: "الصلاحيات",
  Audit: "سجل التدقيق",
  Dashboard: "لوحة التحكم",
  Maintenance: "الصيانة",
};
const moduleLabel = (mod: string) => MODULE_LABELS[mod] ?? mod;

function groupByModule(
  permissions: Permission[],
): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module || "أخرى"] ??= []).push(p);
    return acc;
  }, {});
}

interface RoleDetailModalProps {
  role: Role;
  allPermissions: Permission[];
  onClose: () => void;
  onSave: (roleId: string, permissionIds: string[]) => Promise<boolean>;
}

export function RoleDetailModal({
  role,
  allPermissions,
  onClose,
  onSave,
}: RoleDetailModalProps) {
  const currentIds = role.permissions?.map((rp) => rp.permission.id) ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [saved, setSaved] = useState(false);

  const grouped = groupByModule(allPermissions);
  const activeSet = new Set(currentIds);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setApiError("");
    const ok = await onSave(role.id, [...selected]);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setApiError("حدث خطأ أثناء حفظ الصلاحيات. حاول مرة أخرى.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-detail-title"
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          width: "100%",
          maxWidth: 640,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
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
            flexShrink: 0,
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
              تفاصيل الدور
            </p>
            <h2
              id="role-detail-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "4px 0 0",
              }}
            >
              {role.name}
            </h2>
            {role.description && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                  marginTop: 4,
                }}
              >
                {role.description}
              </p>
            )}
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
        <div
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {apiError && (
            <Alert
              type="error"
              message={apiError}
              onClose={() => setApiError("")}
            />
          )}
          {saved && (
            <Alert
              type="success"
              message="تم حفظ التغييرات بنجاح."
              onClose={() => setSaved(false)}
            />
          )}

          <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {selected.size} من {allPermissions.length} صلاحية مفعّلة لهذا الدور
          </p>

          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {Object.entries(grouped).map(([mod, perms], idx) => (
              <div
                key={mod}
                style={{
                  borderBottom:
                    idx < Object.keys(grouped).length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                <div
                  style={{
                    padding: "0.625rem 1rem",
                    background: "var(--color-surface-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {moduleLabel(mod)}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                  }}
                >
                  {perms.map((perm) => {
                    const checked = selected.has(perm.id);
                    const wasActive = activeSet.has(perm.id);
                    return (
                      <label
                        key={perm.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "0.5rem 0.625rem",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${checked ? "#BFDBFE" : "var(--color-border)"}`,
                          background: checked
                            ? "#EFF6FF"
                            : "var(--color-surface-muted)",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(perm.id)}
                          style={{
                            width: 14,
                            height: 14,
                            marginTop: 1,
                            cursor: "pointer",
                            accentColor: "#2563EB",
                          }}
                        />
                        <div>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: checked
                                ? "#1D4ED8"
                                : "var(--color-text-primary)",
                              margin: 0,
                            }}
                          >
                            {perm.name}
                          </p>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "var(--radius-full)",
                              color: wasActive ? "#166534" : "#991B1B",
                              background: wasActive ? "#DCFCE7" : "#FEF2F2",
                            }}
                          >
                            {wasActive ? "نشطة حالياً" : "غير نشطة"}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "flex-end",
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
            flexShrink: 0,
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
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSave}
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
            {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}
