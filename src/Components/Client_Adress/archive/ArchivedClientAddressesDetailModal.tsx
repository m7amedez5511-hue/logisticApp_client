"use client";

import { useEffect } from "react";
import type { ArchivedClientAddress } from "@/src/types/client_adresses";

interface ArchivedClientAddressesDetailModalProps {
  address: ArchivedClientAddress;
  onClose: () => void;
}

// ── small helper components ───────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "0.75rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)",
      letterSpacing: "0.08em", textTransform: "uppercase",
      margin: "1.25rem 0 0", paddingBottom: "0.25rem",
      borderBottom: "1px solid var(--color-border)",
    }}>
      {title}
    </p>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function ArchivedClientAddressesDetailModal({ address, onClose }: ArchivedClientAddressesDetailModalProps) {
  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const { details, contactPerson, location } = address;

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="archived-address-detail-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 80,
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
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#EA580C", fontWeight: 600, margin: 0 }}>
              عنوان مؤرشف
            </p>
            <h2 id="archived-address-detail-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {address.label}
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
        <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "70vh" }} dir="rtl">
          <DetailRow label="معرف العميل" value={address.clientId} />
          <DetailRow label="الفرع" value={address.branchName} />

          <SectionHeader title="تفاصيل العنوان" />
          <DetailRow label="الشارع"        value={details.street} />
          <DetailRow label="المدينة"       value={details.city} />
          <DetailRow label="المنطقة"       value={details.state} />
          <DetailRow label="الحي"          value={details.district} />
          <DetailRow label="رقم المبنى"    value={details.buildingNo} />
          <DetailRow label="رقم الوحدة"    value={details.unitNo} />
          <DetailRow label="الرقم الإضافي"  value={details.additionalNo} />
          <DetailRow label="الرمز البريدي"  value={details.zipCode} />
          <DetailRow label="الدولة"        value={details.country} />

          {(contactPerson?.name || contactPerson?.phone) && (
            <>
              <SectionHeader title="جهة الاتصال" />
              <DetailRow label="الاسم"      value={contactPerson.name} />
              <DetailRow label="رقم الهاتف" value={contactPerson.phone} />
            </>
          )}

          {location?.coordinates && (
            <>
              <SectionHeader title="الإحداثيات الجغرافية" />
              <DetailRow label="خط الطول (Longitude)" value={String(location.coordinates[0])} />
              <DetailRow label="خط العرض (Latitude)"  value={String(location.coordinates[1])} />
            </>
          )}

          <SectionHeader title="معلومات النظام" />
          <DetailRow label="حالة التوثيق"  value={address.isValidated ? "موثّق" : "غير موثّق"} />
          <DetailRow label="تاريخ الإنشاء" value={new Date(address.createdAt).toLocaleString("ar-SA")} />
          <DetailRow label="آخر تحديث"     value={new Date(address.updatedAt).toLocaleString("ar-SA")} />
          {address.deletedAt && (
            <DetailRow label="تاريخ الحذف" value={new Date(address.deletedAt).toLocaleString("ar-SA")} />
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