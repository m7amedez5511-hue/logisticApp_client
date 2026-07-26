"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spinner } from "../../UI";
import { getStoredToken } from "@/src/lib/auth";
import { archivedUserService } from "@/src/services/archive/archivedUser.service";
import type { ArchivedUser } from "@/src/types/user";

interface ArchivedUserDetailModalProps {
  userId:  string;
  onClose: () => void;
}

// ── small helper components ───────────────────────────────────────────────────
// (No equivalents in the shared UI kit — DetailRow/StatusBadge/Avatar are
// purpose-built layouts, not generic form/action controls, so they stay custom.)
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
// pill (no dot indicator), and the pulse-dot is the whole point of this status
// chip's design.
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

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #EA580C 0%, #B91C1C 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 700, color: "#FFF",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(234,88,12,.3)",
    }}>
      {initials}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function ArchivedUserDetailModal({ userId, onClose }: ArchivedUserDetailModalProps) {
  const [user,    setUser]    = useState<ArchivedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // fetch archived user details on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const data = await archivedUserService.getById(userId, token);
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات المستخدم المؤرشف. يرجى المحاولة لاحقاً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      open
      title={user?.name ?? "عرض المستخدم"}
      subtitle="مستخدم مؤرشف"
      onClose={onClose}
      size="md"
      zIndex={60}
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

      {/* error */}
      {!loading && error && <Alert type="error" message={error} />}

      {/* content */}
      {!loading && user && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }} dir="rtl">

          {/* avatar + name + status row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0 0 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "0.25rem",
          }}>
            <Avatar name={user.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{user.name}</p>
              {user.userName && (
                <p style={{ marginTop: 3, fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                  @{user.userName}
                </p>
              )}
              <div style={{ marginTop: 8 }}>
                <StatusBadge active={user.isActive} />
              </div>
            </div>
          </div>

          {/* detail rows */}
          <DetailRow label="رقم الهاتف"        value={user.phone} />
          <DetailRow label="البريد الإلكتروني"  value={user.email} />
          <DetailRow label="تاريخ الإنشاء"      value={fmt(user.createdAt)} />
          <DetailRow label="آخر تحديث"          value={fmt(user.updatedAt)} />
        </div>
      )}
    </Modal>
  );
}