"use client";

import { useEffect } from "react";
import { Spinner } from "../UI";
import type { Client } from "@/src/types/client";

interface DeleteConfirmModalProps {
  client:    Client;
  deleting:  boolean;
  onCancel:  () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  client,
  deleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  // Close on Escape — identical to User/DeleteConfirmModal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="del-client-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
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
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid #FECACA",
          boxShadow: "0 20px 48px rgba(0,0,0,.18)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          textAlign: "center",
        }}
      >
        {/* أيقونة الحذف */}
        <div
          style={{
            width: 52,
            height: 52,
            margin: "0 auto",
            borderRadius: "50%",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <div>
          <h2
            id="del-client-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            حذف العميل
          </h2>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
            }}
          >
            هل أنت متأكد من حذف{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {client.name}
            </strong>
            ؟ سيتم حذف جميع عناوينه أيضاً. لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1,
              height: 40,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13,
              fontWeight: 600,
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
              flex: 1,
              height: 40,
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "#DC2626",
              fontSize: 13,
              fontWeight: 700,
              color: "#FFF",
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
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