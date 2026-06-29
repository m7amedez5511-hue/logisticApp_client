"use client";

import type { ClientAddress } from "@/src/types/client_adresses";

// ─── Helpers ───────────────────────────────────────────────────────────────

function labelIcon(label: string): string {
  const map: Record<string, string> = {
    "فوترة":         "💳",
    "شحن":           "📦",
    "المقر الرئيسي": "🏢",
    "فرع":           "🏬",
    "مستودع":        "🏭",
    billing:         "💳",
    shipping:        "📦",
    "head office":   "🏢",
    branch:          "🏬",
    warehouse:       "🏭",
  };
  return map[label.toLowerCase()] ?? "📍";
}

// ─── Sub-components ────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value?: string | null;
  ltr?: boolean;
}) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "0.75rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
      <span
        dir={ltr ? "ltr" : "rtl"}
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          fontFamily: ltr ? "var(--font-mono)" : "var(--font-sans)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.875rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}
      >
        <span style={{ fontSize: 16 }} aria-hidden="true">{icon}</span>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-text-secondary)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </p>
      </div>

      {/* Card body */}
      <div
        dir="rtl"
        style={{ padding: "0 1.5rem" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface AddressDetailsProps {
  address: ClientAddress;
}

export function AddressDetails({ address }: AddressDetailsProps) {
  const { details, contactPerson, location } = address;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Identity card — label + branch */}
      <div
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-card)",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
        dir="rtl"
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--radius-lg)",
            background: "var(--color-brand-50)",
            border: "1px solid var(--color-brand-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {labelIcon(address.label)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {address.label}
          </p>
          {address.branchName && (
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 13,
                color: "var(--color-text-muted)",
              }}
            >
              {address.branchName}
            </p>
          )}
        </div>
      </div>

      {/* Address details */}
      <SectionCard title="تفاصيل العنوان" icon="🗺️">
        <DetailRow label="الشارع"           value={details.street} />
        <DetailRow label="المدينة"          value={details.city} />
        <DetailRow label="المنطقة / الولاية" value={details.state} />
        <DetailRow label="الحي"             value={details.district} />
        <DetailRow label="رقم المبنى"       value={details.buildingNo} ltr />
        <DetailRow label="رقم الوحدة"       value={details.unitNo}     ltr />
        <DetailRow label="الرقم الإضافي"    value={details.additionalNo} ltr />
        <DetailRow label="الرمز البريدي"    value={details.zipCode}    ltr />
        <DetailRow label="الشقة / الطابق"   value={details.apartment} />
        <DetailRow label="الدولة"           value={details.country} />
      </SectionCard>

      {/* Contact person — only when present */}
      {(contactPerson?.name || contactPerson?.phone) && (
        <SectionCard title="جهة الاتصال" icon="👤">
          <DetailRow label="الاسم"      value={contactPerson.name} />
          <DetailRow label="رقم الهاتف" value={contactPerson.phone} ltr />
        </SectionCard>
      )}

      {/* Coordinates */}
      {location?.coordinates && (
        <SectionCard title="الإحداثيات الجغرافية" icon="📡">
          <DetailRow
            label="خط الطول (Longitude)"
            value={String(location.coordinates[0])}
            ltr
          />
          <DetailRow
            label="خط العرض (Latitude)"
            value={String(location.coordinates[1])}
            ltr
          />
        </SectionCard>
      )}

      {/* System metadata */}
      <SectionCard title="معلومات النظام" icon="🕐">
        <DetailRow
          label="تاريخ الإنشاء"
          value={new Date(address.createdAt).toLocaleString("ar-SA", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        />
        <DetailRow
          label="آخر تحديث"
          value={new Date(address.updatedAt).toLocaleString("ar-SA", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        />
      </SectionCard>
    </div>
  );
}