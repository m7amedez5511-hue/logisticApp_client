"use client";

import { useEffect } from "react";
import { Spinner } from "../../UI";
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
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="archived-maintenance-detail-title"
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
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#EA580C", fontWeight: 600, margin: 0 }}>
              سجل صيانة مؤرشف
            </p>
            <h2 id="archived-maintenance-detail-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {record ? record.reason : "عرض السجل"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "70vh" }} dir="rtl">
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)", background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#991B1B", fontWeight: 500, textAlign: "center" }}>
              {error}
            </div>
          )}

          {!loading && record && (() => {
            const status = MAINTENANCE_STATUS_MAP[getMaintenanceStatus(record)];
            return (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  <span style={{ borderRadius: "var(--radius-full)", border: `1px solid ${status.border}`, background: status.bg, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: status.color }}>
                    {status.label}
                  </span>
                  <span style={{ borderRadius: "var(--radius-full)", border: "1px solid #FECACA", background: "#FEF2F2", padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: "#DC2626" }}>
                    مؤرشف
                  </span>
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

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--color-border)", background: "var(--color-surface-muted)", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}
            style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}