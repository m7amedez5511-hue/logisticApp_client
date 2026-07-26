"use client";

import { Alert, Badge, Button, Modal, Spinner } from "../../UI";
import {
  MAINTENANCE_STATUS_MAP,
  fmtDate,
  fmtCost,
  durationDays,
  getMaintenanceStatus,
} from "@/src/types/carMaintanance";
import type { CarMaintenance } from "@/src/types/carMaintanance";

interface ArchivedCarMaintenanceDetailPanelProps {
  record:  CarMaintenance | null;
  loading: boolean;
  error:   string | null;
  onClose: () => void;
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "0.6rem 0", borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", color: "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export function ArchivedCarMaintenanceDetailPanel({ record, loading, error, onClose }: ArchivedCarMaintenanceDetailPanelProps) {
  return (
    <Modal
      open
      title={record ? record.reason : "عرض السجل"}
      subtitle="سجل صيانة مؤرشف"
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

        {!loading && record && (() => {
          const status = MAINTENANCE_STATUS_MAP[getMaintenanceStatus(record)];
          return (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                {/* Dynamic per-status colors come from MAINTENANCE_STATUS_MAP, which
                    doesn't map cleanly onto the fixed Badge color palette — kept custom. */}
                <span style={{ borderRadius: "var(--radius-full)", border: `1px solid ${status.border}`, background: status.bg, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: status.color }}>
                  {status.label}
                </span>
                <Badge label="مؤرشف" color="red" />
              </div>

              {record.car && (
                <DetailRow
                  label="المركبة"
                  value={`${record.car.manufacturer} ${record.car.model} — ${record.car.plateLetters} ${record.car.plateNumber}`}
                  mono
                />
              )}
              <DetailRow label="التكلفة" value={fmtCost(record.cost)} />
              <DetailRow label="تاريخ البدء" value={fmtDate(record.startAt)} />
              <DetailRow label="تاريخ الانتهاء" value={fmtDate(record.endAt)} />
              <DetailRow label="المدة" value={`${durationDays(record.startAt, record.endAt)} يوم`} />
              <DetailRow label="تاريخ الإضافة" value={fmtDate(record.createdAt)} />
              <DetailRow label="آخر تحديث" value={fmtDate(record.updatedAt)} />
            </>
          );
        })()}
      </div>
    </Modal>
  );
}