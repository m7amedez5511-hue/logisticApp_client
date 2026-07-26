"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Modal, Select, Spinner } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { roleService } from "@/src/services/role.service";
import { Permission, Role } from "@/src/types/role";

interface RoleDetailModalProps {
  roleId:      string;
  permissions: Permission[];
  onClose:     () => void;
  onAssign:    (roleId: string, permissionId: string) => Promise<boolean>;
  onRemove:    (roleId: string, permissionId: string) => Promise<boolean>;
}

// (No shared-UI equivalents — purpose-built layouts, not generic controls.)
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

// Kept custom rather than swapped for <Badge/>: Badge only renders a label
// pill (no dot indicator), and the pulse-dot is the whole point of this chip.
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

  const [pendingPermId, setPendingPermId] = useState("");
  const [mutating,       setMutating]     = useState(false);

  const loadRole = async () => {
    try {
      const token = getStoredToken();
      const data = await roleService.getById(roleId, token);
      setRole(data);
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
        const data = await roleService.getById(roleId, token);
        if (!cancelled) setRole(data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات الدور. يرجى المحاولة لاحقاً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roleId]);

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
    <Modal
      open
      title={role?.name ?? "عرض الدور"}
      subtitle="تفاصيل الدور"
      onClose={onClose}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      )}

      {!loading && error && <Alert type="error" message={error} />}

      {!loading && role && (
        <div dir="rtl">
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

          <div style={{ paddingTop: "0.75rem" }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)", margin: "0 0 10px" }}>
              الصلاحيات ({role.permissions?.length ?? 0})
            </p>

            {assignablePermissions.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <Select
                    value={pendingPermId}
                    onChange={(e) => setPendingPermId(e.target.value)}
                    disabled={mutating}
                    dir="rtl"
                  >
                    <option value="">اختر صلاحية لإضافتها…</option>
                    {assignablePermissions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAssign}
                  disabled={!pendingPermId}
                  loading={mutating}
                >
                  إضافة
                </Button>
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
    </Modal>
  );
}