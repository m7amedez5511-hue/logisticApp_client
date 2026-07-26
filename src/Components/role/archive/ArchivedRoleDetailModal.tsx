"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spinner } from "../../UI";
import { getStoredToken } from "@/src/lib/auth";
import { archivedRoleService } from "@/src/services/archive/archivedRole.service";
import type { ArchivedRole } from "@/src/types/role";

interface ArchivedRoleDetailModalProps {
  roleId:  string;
  onClose: () => void;
}

// ── small helper components ───────────────────────────────────────────────────
// (No equivalents in the shared UI kit — purpose-built layouts, not generic
// form/action controls, so they stay custom.)
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "0.75rem 0",
      borderBottom: "1px solid var(--color-border)",
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
      padding: "0.25rem 0.75rem",
      fontSize: 12, fontWeight: 600,
      color: active ? "#166534" : "#991B1B",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16A34A" : "#DC2626" }} />
      {active ? "نشط" : "معطل"}
    </span>
  );
}

function RoleIcon() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #EA580C 0%, #B91C1C 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(234,88,12,.3)",
    }}>
      <i className="ti ti-shield-check" style={{ fontSize: 26, color: "#FFF" }} aria-hidden="true" />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function ArchivedRoleDetailModal({ roleId, onClose }: ArchivedRoleDetailModalProps) {
  const [role,    setRole]    = useState<ArchivedRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // fetch archived role details on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const data = await archivedRoleService.getByIdUnwrapped(roleId, token);
        if (!cancelled) setRole(data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات الدور المؤرشف. يرجى المحاولة لاحقاً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roleId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      open
      title={role?.name ?? "عرض الدور"}
      subtitle="دور مؤرشف"
      onClose={onClose}
      zIndex={60}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {/* loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      )}

      {/* error — fallback UI on API failure */}
      {!loading && error && <Alert type="error" message={error} />}

      {/* content */}
      {!loading && role && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }} dir="rtl">

          {/* icon + name + status row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0 0 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "0.25rem",
          }}>
            <RoleIcon />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{role.name}</p>
              <p style={{ marginTop: 3, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>
                #{role.id}
              </p>
              <div style={{ marginTop: 8 }}>
                <StatusBadge active={role.isActive} />
              </div>
            </div>
          </div>

          {/* detail rows */}
          <DetailRow label="الوصف"          value={role.description} />
          <DetailRow label="تاريخ الإنشاء"   value={fmt(role.createdAt)} />
          <DetailRow label="آخر تحديث"       value={fmt(role.updatedAt)} />
        </div>
      )}
    </Modal>
  );
}