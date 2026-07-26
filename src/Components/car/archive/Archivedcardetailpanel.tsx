"use client";

import { Alert, Badge, Button, Modal, Spinner } from "../../UI";
import { STATUS_MAP, INS_MAP, fmtDate, isExpiringSoon } from "@/src/types/car";
import type { Car, InsuranceStatus } from "@/src/types/car";

interface ArchivedCarDetailPanelProps {
  car:     Car | null;
  loading: boolean;
  error:   string | null;
  onClose: () => void;
}

function DetailRow({ label, value, mono = false, warn = false }: {
  label: string; value: string; mono?: boolean; warn?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "0.6rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        color: warn ? "#D97706" : "var(--color-text-primary)",
        fontWeight: warn ? 600 : 400,
      }}>
        {warn && value !== "—" ? "⚠ " : ""}{value}
      </span>
    </div>
  );
}

export function ArchivedCarDetailPanel({ car, loading, error, onClose }: ArchivedCarDetailPanelProps) {
  return (
    <Modal
      open
      title={car ? `${car.manufacturer} ${car.model}` : "عرض المركبة"}
      subtitle="مركبة مؤرشفة"
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
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
          </div>
        )}

        {!loading && error && <Alert type="error" message={error} />}

        {!loading && car && (
          <>
            {/* status badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {/* Dynamic per-status colors come from STATUS_MAP / INS_MAP, which
                  don't map cleanly onto the fixed Badge color palette — kept custom. */}
              {(() => {
                const s = STATUS_MAP[car.currentStatus];
                return (
                  <span style={{ borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: s.color }}>
                    {s.label}
                  </span>
                );
              })()}
              {car.insuranceStatus && (() => {
                const ins = INS_MAP[car.insuranceStatus as InsuranceStatus];
                return (
                  <span style={{ borderRadius: "var(--radius-full)", border: `1px solid ${ins.color}33`, background: `${ins.color}11`, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: ins.color }}>
                    تأمين: {ins.label}
                  </span>
                );
              })()}
              <Badge label="مؤرشفة" color="red" />
            </div>

            <DetailRow label="رقم اللوحة" value={`${car.plateLetters} ${car.plateNumber}`} mono />
            <DetailRow label="الفرع" value={car.branch?.name ?? "—"} />
            <DetailRow label="رقم الاستمارة" value={car.registrationNumber ?? "—"} mono />
            <DetailRow label="رقم الهيكل (VIN)" value={car.vinNumber ?? "—"} mono />
            <DetailRow label="انتهاء الاستمارة" value={fmtDate(car.registrationExpiryDate)} warn={isExpiringSoon(car.registrationExpiryDate)} />
            <DetailRow label="انتهاء التأمين" value={fmtDate(car.insuranceExpiryDate)} warn={isExpiringSoon(car.insuranceExpiryDate)} />
            <DetailRow label="تاريخ الإضافة" value={fmtDate(car.createdAt)} />
            <DetailRow label="آخر تحديث" value={fmtDate(car.updatedAt)} />
          </>
        )}
      </div>
    </Modal>
  );
}