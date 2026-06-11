"use client";
// Components/Role/DeleteRoleModal.tsx
// Confirm deletion of a role — mirrors DeleteConfirmModal from Users.

import { useEffect } from "react";
import { Spinner } from "../UI";
import type { Role } from "../../services/role.service";

interface DeleteRoleModalProps {
  role:      Role;
  deleting:  boolean;
  onCancel:  () => void;
  onConfirm: () => void;
}

export function DeleteRoleModal({ role, deleting, onCancel, onConfirm }: DeleteRoleModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  const permCount = role.permissions?.length ?? 0;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="del-role-title"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid #FECACA",
          boxShadow: "0 20px 48px rgba(0,0,0,.18)",
          padding: "2rem",
          display: "flex", flexDirection: "column", gap: "1rem",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 52, height: 52, margin: "0 auto",
          borderRadius: "50%",
          background: "#FEF2F2", border: "1px solid #FECACA",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div>
          <h2 id="del-role-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            حذف الدور
          </h2>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            هل أنت متأكد من حذف دور{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{role.name}</strong>؟
          </p>
          {permCount > 0 && (
            <p style={{
              marginTop: 8, fontSize: 12,
              background: "#FEF3C7", color: "#92400E",
              border: "1px solid #FDE68A",
              borderRadius: "var(--radius-md)",
              padding: "0.5rem 0.75rem",
            }}>
              ⚠ يحتوي هذا الدور على {permCount} صلاحية مرتبطة، سيتم إلغاء ارتباطها تلقائياً.
            </p>
          )}
          <p style={{ marginTop: 6, fontSize: 12, color: "#DC2626" }}>
            لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1, height: 40,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13, fontWeight: 600,
              color: "var(--color-text-secondary)",
              cursor: deleting ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, height: 40,
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "#DC2626",
              fontSize: 13, fontWeight: 700,
              color: "#FFF",
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "var(--font-sans)",
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting && <Spinner size="sm" className="text-white" />}
            {deleting ? "جارٍ الحذف…" : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
}