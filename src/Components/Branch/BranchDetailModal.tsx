"use client";

import { useEffect, useState } from "react";
import { Spinner } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { branchService } from "@/src/services/branch.service";
import type { BranchDetail } from "@/src/types/branch";

interface BranchDetailModalProps {
  branchId: string;
  onClose:  () => void;
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

function BranchIcon() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(37,99,235,.3)",
    }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
        <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
        <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
      </svg>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function BranchDetailModal({ branchId, onClose }: BranchDetailModalProps) {
  const [branch,  setBranch]  = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // fetch branch details on mount
  useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const token = getStoredToken();
      const data = await branchService.getById(branchId, token);
      if (!cancelled) setBranch(data);
    } catch {
      if (!cancelled) setError("تعذّر تحميل بيانات الفرع. يرجى المحاولة لاحقاً.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [branchId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  const fullAddress = (b: BranchDetail) =>
    [b.street, b.district, b.city, b.state, b.country].filter(Boolean).join("، ") || null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="branch-detail-title"
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
              بيانات الفرع
            </p>
            <h2 id="branch-detail-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {branch?.name ?? "عرض الفرع"}
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
          {!loading && branch && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }} dir="rtl">

              {/* icon + name + status row */}
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "0 0 1.25rem",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "0.25rem",
              }}>
                <BranchIcon />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{branch.name}</p>
                  {branch.city && (
                    <p style={{ marginTop: 3, fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                      {branch.city}
                    </p>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge active={branch.isActive} />
                  </div>
                </div>
              </div>

              {/* detail rows */}
              <DetailRow label="رقم الهاتف"        value={branch.phone} />
              <DetailRow label="البريد الإلكتروني"  value={branch.email} />
              <DetailRow label="العنوان"            value={fullAddress(branch)} />
              <DetailRow label="رقم المبنى"         value={branch.buildingNo} />
              <DetailRow label="رقم الوحدة"         value={branch.unitNo} />
              <DetailRow label="الرمز البريدي"      value={branch.zipCode} />
              <DetailRow
                label="الموقع الجغرافي"
                value={branch.latitude != null && branch.longitude != null
                  ? `${branch.latitude}, ${branch.longitude}`
                  : null}
              />
              <DetailRow label="تاريخ الإنشاء"      value={fmt(branch.createdAt)} />
              <DetailRow label="آخر تحديث"          value={fmt(branch.updatedAt)} />
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