// src/Components/Car_Maintanance/CarMaintananceDetailPanel.tsx
// CHANGE: replaced CarMaintenanceDeleteModal with ConfirmDialog per Issue 1.
// Description string rebuilt inline using fmtCost, matching the original
// modal's wording exactly (see Issue 1 edge-case note on preserving fmtCost formatting).
"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner, ConfirmDialog } from "../UI";
import { CarMaintenanceFormModal } from "./CarMaintananceFormModal";
import {
  useCarMaintenanceList,
  useCarMaintenanceMutations,
  useMaintenanceToast,
} from "@/src/hooks/UseCarsMaintanance";
import {
  MAINTENANCE_STATUS_MAP,
  fmtDate,
  fmtCost,
  durationDays,
  getMaintenanceStatus,
} from "@/src/types/carMaintanance";
import type {
  CarMaintenance,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from "@/src/types/carMaintanance";

// ── Toast ─────────────────────────────────────────────────────────────────────

function MaintenanceToast({ notification }: { notification: { type: "success" | "error"; message: string } | null }) {
  if (!notification) return null;
  const ok = notification.type === "success";
  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, pointerEvents: "none",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0.75rem 1.25rem",
        borderRadius: "var(--radius-full)",
        background: ok ? "#065F46" : "#7F1D1D",
        color: "#FFF", fontSize: 13, fontWeight: 600,
        boxShadow: "0 8px 32px rgba(0,0,0,.25)",
        maxWidth: "90vw", whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)",
      }}>
        <span style={{ fontSize: 16 }}>{ok ? "✓" : "⚠"}</span>
        <span>{notification.message}</span>
      </div>
    </div>
  );
}

// ── Record card ───────────────────────────────────────────────────────────────

function MaintenanceCard({
  record,
  onEdit,
  onDelete,
}: {
  record: CarMaintenance;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = MAINTENANCE_STATUS_MAP[getMaintenanceStatus(record)];

  return (
    <div style={{
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border)",
      background: "var(--color-surface)",
      padding: "1rem",
      display: "flex", flexDirection: "column", gap: "0.6rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
          {record.reason}
        </p>
        <span style={{
          borderRadius: "var(--radius-full)",
          border: `1px solid ${status.border}`,
          background: status.bg,
          padding: "0.2rem 0.625rem",
          fontSize: 11, fontWeight: 700, color: status.color,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: 12 }}>
        <div>
          <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>التكلفة</span>
          <span style={{ color: "var(--color-text-primary)" }}>{fmtCost(record.cost)}</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>المدة</span>
          <span style={{ color: "var(--color-text-primary)" }}>{durationDays(record.startAt, record.endAt)} يوم</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>تاريخ البدء</span>
          <span style={{ color: "var(--color-text-primary)" }}>{fmtDate(record.startAt)}</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>تاريخ الانتهاء</span>
          <span style={{ color: "var(--color-text-primary)" }}>{fmtDate(record.endAt)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.25rem" }}>
        <button type="button" onClick={onEdit}
          style={{ flex: 1, height: 32, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          تعديل
        </button>
        <button type="button" onClick={onDelete}
          style={{ height: 32, padding: "0 0.875rem", borderRadius: "var(--radius-md)", border: "1px solid #FECACA", background: "#FEF2F2", fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          حذف
        </button>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarMaintenanceDetailPanelProps {
  carId: string;
  /** e.g. "تويوتا لاند كروزر — أ ب ج 1234", shown in the header. */
  carLabel?: string;
  onClose: () => void;
  /** Called after any maintenance create/update/delete succeeds, since those
   *  operations can also change the parent car's currentStatus on the backend.
   *  The caller should use this to refetch the car it's displaying elsewhere
   *  (e.g. in a CarDetailPanel shown alongside this one). */
  onCarStatusChanged?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarMaintenanceDetailPanel({ carId, carLabel, onClose, onCarStatusChanged }: CarMaintenanceDetailPanelProps) {
  const { records, loading, error, loadRecords, removeRecord } = useCarMaintenanceList(carId);
  const { toast, notify } = useMaintenanceToast();

  const [formTarget, setFormTarget]     = useState<CarMaintenance | null | false>(false); // false = closed
  const [deleteTarget, setDeleteTarget] = useState<CarMaintenance | null>(null);

  const getEditTarget = useCallback(
    () => (formTarget instanceof Object && formTarget !== null ? (formTarget as CarMaintenance) : null),
    [formTarget],
  );

  const { deleting, handleFormSubmit, handleDeleteConfirm } = useCarMaintenanceMutations({
    carId,
    onSuccess: (msg) => { notify({ type: "success", message: msg }); loadRecords(); onCarStatusChanged?.(); },
    onError:   (msg) =>   notify({ type: "error", message: msg }),
    onDeleted: (id) => { removeRecord(id); setDeleteTarget(null); onCarStatusChanged?.(); },
    getEditTarget,
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && formTarget === false && !deleteTarget) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [formTarget, deleteTarget, onClose]);

  const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  return (
    <>
      <MaintenanceToast notification={toast} />

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }} />

      {/* Panel */}
      <aside
        aria-label="سجل صيانة المركبة"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
          width: "min(480px, 100vw)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex", flexDirection: "column",
          boxShadow: "8px 0 40px rgba(0,0,0,.18)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-muted)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
                سجل الصيانة
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
                {carLabel ?? "المركبة"}
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="إغلاق"
              style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ×
            </button>
          </div>

          {!loading && !error && records.length > 0 && (
            <p style={{ marginTop: 10, fontSize: 12, color: "var(--color-text-muted)" }}>
              {records.length} سجل · إجمالي التكلفة {fmtCost(totalCost)}
            </p>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }} dir="rtl">
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2rem 0" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>جارٍ التحميل…</span>
            </div>
          )}

          {error && (
            <div style={{ borderRadius: "var(--radius-md)", background: "#FEF2F2", border: "1px solid #FECACA", padding: "0.75rem 1rem", fontSize: 13, color: "#DC2626" }}>
              ⚠ {error}
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔧</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>لا توجد سجلات صيانة بعد</p>
              <p style={{ fontSize: 12, color: "var(--color-text-hint)", marginTop: 4 }}>
                اضغط على &quot;إضافة سجل&quot; لتسجيل أول عملية صيانة لهذه المركبة.
              </p>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {records.map((record) => (
                <MaintenanceCard
                  key={record.id}
                  record={record}
                  onEdit={() => setFormTarget(record)}
                  onDelete={() => setDeleteTarget(record)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--color-border)", background: "var(--color-surface-muted)", flexShrink: 0 }}>
          <button type="button" onClick={() => setFormTarget(null)}
            style={{ width: "100%", height: 40, borderRadius: "var(--radius-md)", border: "none", background: "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            إضافة سجل صيانة
          </button>
        </div>
      </aside>

      {/* Nested modals */}
      {formTarget !== false && (
        <CarMaintenanceFormModal
          editRecord={formTarget}
          carLabel={carLabel}
          onClose={() => setFormTarget(false)}
          onSubmit={(payload: CreateMaintenancePayload | UpdateMaintenancePayload, isNew: boolean) =>
            handleFormSubmit(payload, isNew)
          }
        />
      )}

      {/* CHANGE: CarMaintenanceDeleteModal -> ConfirmDialog (Issue 1).
          `open` is now explicit since ConfirmDialog is not conditionally
          mounted the way the old modal was. Description text ported
          verbatim from the deleted CarMaintananceDeleteModal.tsx,
          including fmtCost() formatting for the cost figure. */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف سجل الصيانة"
        description={
          deleteTarget
            ? `هل أنت متأكد من حذف سجل ${deleteTarget.reason} (${fmtCost(deleteTarget.cost)})؟ لا يمكن التراجع عن هذا الإجراء.`
            : ""
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteConfirm(deleteTarget)}
      />
    </>
  );
}