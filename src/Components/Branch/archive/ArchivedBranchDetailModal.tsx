"use client";

import { Badge, Button, Modal } from "../../UI";
import type { ArchivedBranch } from "@/src/types/branch";

interface ArchivedBranchDetailModalProps {
  branch:  ArchivedBranch;
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

function BranchIcon() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #EA580C 0%, #B91C1C 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(234,88,12,.3)",
    }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
        <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
        <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
      </svg>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
// NOTE: there is no GET /branches/archived/{id} route on the backend, so this
// modal does NOT fetch — it just renders the ArchivedBranch object that was
// already loaded from GET /branches/archived (passed down from the table).
export function ArchivedBranchDetailModal({ branch, onClose }: ArchivedBranchDetailModalProps) {
  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  const fullAddress = (b: ArchivedBranch) =>
    [b.street, b.district, b.city, b.state, b.country].filter(Boolean).join("، ") || null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      subtitle="فرع مؤرشف"
      title={branch.name}
      zIndex={60}
      footer={
        <Button variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
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
            <p style={{ marginTop: 3, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>
              #{branch.id}
            </p>
            <div style={{ marginTop: 8 }}>
              <Badge label={branch.isActive ? "نشط" : "معطل"} color={branch.isActive ? "green" : "red"} />
            </div>
          </div>
        </div>

        {/* detail rows — every field requested */}
        <DetailRow label="رقم الهاتف"        value={branch.phone} />
        <DetailRow label="البريد الإلكتروني"  value={branch.email} />
        <DetailRow label="الدولة"             value={branch.country} />
        <DetailRow label="المدينة"            value={branch.city} />
        <DetailRow label="المنطقة"            value={branch.state} />
        <DetailRow label="الحي"               value={branch.district} />
        <DetailRow label="الشارع"             value={branch.street} />
        <DetailRow label="العنوان الكامل"     value={fullAddress(branch)} />
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
    </Modal>
  );
}