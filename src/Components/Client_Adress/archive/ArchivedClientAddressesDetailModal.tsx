"use client";

import { Button, Modal } from "../../UI";
import type { ArchivedClientAddress } from "@/src/types/client_adresses";

interface ArchivedClientAddressesDetailModalProps {
  address: ArchivedClientAddress;
  onClose: () => void;
}

// ── small helper components (no template exists for a plain label/value row) ──
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
  const { details, contactPerson, location } = address;

  return (
    <Modal
      open
      title={address.label}
      subtitle="عنوان مؤرشف"
      onClose={onClose}
      zIndex={60}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      <div dir="rtl">
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
    </Modal>
  );
}