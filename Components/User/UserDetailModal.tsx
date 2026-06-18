"use client";

import { useEffect, useState } from "react";
import { Spinner } from "../UI";
import { getStoredToken } from "../../lib/auth";
import { userService } from "../../services/user.service";
import type { UserDetail } from "../../types/user";

interface UserDetailModalProps {
  userId:  string;
  onClose: () => void;
}

// ── small helper components ───────────────────────────────────────────────────
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
      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 700, color: "#FFF",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(37,99,235,.3)",
    }}>
      {initials}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [user,    setUser]    = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // fetch user details on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const res   = await userService.getById(userId, token);
        if (!cancelled) setUser(res.data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات المستخدم. يرجى المحاولة لاحقاً.");
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
    <div
      role="dialog" aria-modal="true" aria-labelledby="detail-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 55,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* ── header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
              بيانات المستخدم
            </p>
            <h2 id="detail-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {user?.name ?? "عرض المستخدم"}
            </h2>
          </div>
          <button
            type="button" onClick={onClose} aria-label="إغلاق"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              cursor: "pointer", fontSize: 18,
              color: "var(--color-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* ── body ── */}
        <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "70vh" }}>

          {/* loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          )}

          {/* error */}
          {!loading && error && (
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              background: "#FEF2F2", border: "1px solid #FECACA",
              fontSize: 13, color: "#991B1B", fontWeight: 500,
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

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
              <DetailRow label="رقم الهاتف"       value={user.phone} />
              <DetailRow label="البريد الإلكتروني" value={user.email} />
              <DetailRow label="الدور"             value={user.role?.name} />
              <DetailRow label="وصف الدور"         value={user.role?.description} />
              <DetailRow label="الفرع"             value={user.branch?.name} />
              <DetailRow label="تاريخ الإنشاء"     value={fmt(user.createdAt)} />
              <DetailRow label="آخر تحديث"         value={fmt(user.updatedAt)} />
              {user.passwordChangedAt && (
                <DetailRow label="آخر تغيير لكلمة المرور" value={fmt(user.passwordChangedAt)} />
              )}
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            type="button" onClick={onClose}
            style={{
              height: 40, padding: "0 1.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13, fontWeight: 600,
              color: "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}