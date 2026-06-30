"use client";

import { useEffect, useState } from "react";
import { Spinner } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { roleService } from "@/src/services/role.service";
import { Permission, Role } from "@/src/types/role";

interface RoleDetailModalProps {
  roleId:      string;
  permissions: Permission[]; // full catalog, for the "add permission" select
  onClose:     () => void;
  onAssign:    (roleId: string, permissionId: string) => Promise<boolean>;
  onRemove:    (roleId: string, permissionId: string) => Promise<boolean>;
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

export function RoleDetailModal({ roleId, permissions, onClose, onAssign, onRemove }: RoleDetailModalProps) {
  const [role,    setRole]    = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── Inline permission mutation state ─────────────────────────────────────────
  const [pendingPermId, setPendingPermId] = useState("");
  const [mutating,       setMutating]     = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const loadRole = async () => {
    try {
      const token = getStoredToken();
      const res   = await roleService.getById(roleId, token);
      setRole((res as unknown as { data: Role }).data);
    } catch {
      setError("تعذّر تحميل بيانات الدور. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

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

  // Endpoint 1: POST /role/{id}/permissions
  const handleAssign = async () => {
    if (!pendingPermId || mutating) return;
    setMutating(true);
    const ok = await onAssign(roleId, pendingPermId);
    if (ok) {
      setPendingPermId("");
      await loadRole();
    }
    setMutating(false);
  };

  // Endpoint 3: DELETE /role/{id}/permissions/{permissionId}
  const handleRemove = async (permissionId: string) => {
    if (mutating) return;
    setMutating(true);
    const ok = await onRemove(roleId, permissionId);
    if (ok) await loadRole();
    setMutating(false);
  };

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  const assignablePermissions = permissions.filter(
    (p) => !role?.permissions?.some((rp) => rp.permission.id === p.id),
  );

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
              <div style={{ paddingTop: "0.75rem" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)", margin: "0 0 10px" }}>
                  الصلاحيات ({role.permissions?.length ?? 0})
                </p>

                {/* Assign new permission — Endpoint 1 */}
                {assignablePermissions.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <select
                      value={pendingPermId}
                      onChange={(e) => setPendingPermId(e.target.value)}
                      disabled={mutating}
                      style={{
                        flex: 1, height: 36, borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)", fontSize: 12,
                        padding: "0 0.5rem", fontFamily: "var(--font-sans)",
                        color: "var(--color-text-primary)", background: "var(--color-surface)",
                      }}
                    >
                      <option value="">اختر صلاحية لإضافتها…</option>
                      {assignablePermissions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      type="button" onClick={handleAssign} disabled={!pendingPermId || mutating}
                      style={{
                        height: 36, padding: "0 0.875rem", borderRadius: "var(--radius-md)",
                        border: "none", background: "var(--color-brand-600)", color: "#FFF",
                        fontSize: 12, fontWeight: 700,
                        cursor: pendingPermId && !mutating ? "pointer" : "not-allowed",
                        opacity: !pendingPermId || mutating ? 0.6 : 1,
                        fontFamily: "var(--font-sans)",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      {mutating && <Spinner size="sm" className="text-white" />}
                      إضافة
                    </button>
                  </div>
                )}

                {role.permissions && role.permissions.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {role.permissions.map(({ permission }) => (
                      <span key={permission.id} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "0.25rem 0.4rem 0.25rem 0.6rem", borderRadius: "var(--radius-md)",
                        background: "#EFF6FF", border: "1px solid #BFDBFE",
                        fontSize: 11, fontWeight: 600, color: "#1D4ED8",
                      }}>
                        {permission.name}
                        {/* Endpoint 3: remove this permission */}
                        <button
                          type="button" onClick={() => handleRemove(permission.id)} disabled={mutating}
                          aria-label={`إزالة ${permission.name}`}
                          style={{
                            background: "none", border: "none",
                            cursor: mutating ? "not-allowed" : "pointer",
                            color: "#1D4ED8", fontSize: 13, lineHeight: 1, padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--color-text-hint)", fontStyle: "italic" }}>لا توجد صلاحيات مسندة لهذا الدور</p>
                )}
              </div>
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