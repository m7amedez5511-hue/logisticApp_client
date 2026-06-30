"use client";

import { useEffect, useState } from "react";
import { Spinner } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { roleService } from "@/src/services/role.service";
import { Role } from "@/src/types/role";


interface RoleDetailModalProps {
  roleId:  string;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: value ? "var(--color-text-primary)" : "var(--color-text-hint)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      borderRadius: "var(--radius-full)",
      border: active ? "1px solid #BBF7D0" : "1px solid #FECACA",
      background: active ? "#DCFCE7" : "#FEF2F2",
      padding: "0.25rem 0.75rem", fontSize: 12, fontWeight: 600,
      color: active ? "#166534" : "#991B1B",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "نشط" : "معطل"}
    </span>
  );
}

export function RoleDetailModal({ roleId, onClose }: RoleDetailModalProps) {
  const [role,    setRole]    = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const res   = await roleService.getById(roleId, token);
        if (!cancelled) setRole((res as unknown as { data: Role }).data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات الدور. يرجى المحاولة لاحقاً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roleId]);

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="role-detail-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 55,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 520,
        background: "var(--color-surface)",
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 24px 64px rgba(0,0,0,.18)",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
              تفاصيل الدور
            </p>
            <h2 id="role-detail-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {role?.name ?? "عرض الدور"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "70vh" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)", background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#991B1B", fontWeight: 500, textAlign: "center" }}>
              {error}
            </div>
          )}

          {!loading && role && (
            <div dir="rtl">
              {/* Role icon + name + status */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--color-border)", marginBottom: "0.25rem" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "var(--radius-xl)",
                  background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>
                  🛡️
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{role.name}</p>
                  {role.description && (
                    <p style={{ marginTop: 3, fontSize: 12, color: "var(--color-text-muted)" }}>{role.description}</p>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge active={role.isActive} />
                  </div>
                </div>
              </div>

              <DetailRow label="تاريخ الإنشاء" value={fmt(role.createdAt)} />
              {role.updatedAt && <DetailRow label="آخر تحديث" value={fmt(role.updatedAt)} />}

              {/* Permissions list */}
              {role.permissions && role.permissions.length > 0 && (
                <div style={{ paddingTop: "0.75rem" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)", margin: "0 0 10px" }}>
                    الصلاحيات ({role.permissions.length})
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {role.permissions.map(({ permission }) => (
                      <span key={permission.id} style={{
                        display: "inline-flex", alignItems: "center",
                        padding: "0.25rem 0.6rem", borderRadius: "var(--radius-md)",
                        background: "#EFF6FF", border: "1px solid #BFDBFE",
                        fontSize: 11, fontWeight: 600, color: "#1D4ED8",
                      }}>
                        {permission.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!role.permissions || role.permissions.length === 0) && (
                <div style={{ paddingTop: "0.75rem" }}>
                  <p style={{ fontSize: 13, color: "var(--color-text-hint)", fontStyle: "italic" }}>لا توجد صلاحيات مسندة لهذا الدور</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "1rem 1.5rem", borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)", display: "flex", justifyContent: "flex-end",
        }}>
          <button type="button" onClick={onClose}
            style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}