"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, ArchiveButton, PageHeader, Spinner, Toast } from "@/src/Components/UI";
import { CarMaintenanceFormModal } from "@/src/Components/Car_Maintanance/CarMaintananceFormModal";
import { CarMaintenanceDeleteModal } from "@/src/Components/Car_Maintanance/CarMaintananceDeleteModal";
import { ArchivedCarsMaintenanceModal } from "@/src/Components/Car_Maintanance/archive/ArchivedCarsMaintananceModal";
import {
  useCarMaintenanceList,
  useCarMaintenanceMutations,
  useMaintenanceToast,
} from "@/src/hooks/UseCarsMaintanance";
import { useCarDetail } from "@/src/hooks/useCars";
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

function MaintenanceCard({
  record, onView, onEdit, onDelete,
}: {
  record: CarMaintenance;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = MAINTENANCE_STATUS_MAP[getMaintenanceStatus(record)];

  return (
    <article style={{
      borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
      background: "var(--color-surface)", overflow: "hidden", boxShadow: "var(--shadow-card)",
    }}>
      <div style={{ height: 4, background: status.dot }} />
      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            {record.reason}
          </p>
          <span style={{
            borderRadius: "var(--radius-full)", border: `1px solid ${status.border}`,
            background: status.bg, padding: "0.2rem 0.625rem",
            fontSize: 11, fontWeight: 700, color: status.color, whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {status.label}
          </span>
        </div>

        <div style={{ marginTop: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>التكلفة</span>
            <span style={{ color: "var(--color-text-primary)", marginTop: 2, display: "block" }}>{fmtCost(record.cost)}</span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>المدة</span>
            <span style={{ color: "var(--color-text-primary)", marginTop: 2, display: "block" }}>{durationDays(record.startAt, record.endAt)} يوم</span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>تاريخ البدء</span>
            <span style={{ color: "var(--color-text-secondary)", marginTop: 2, display: "block" }}>{fmtDate(record.startAt)}</span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>تاريخ الانتهاء</span>
            <span style={{ color: "var(--color-text-secondary)", marginTop: 2, display: "block" }}>{fmtDate(record.endAt)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button type="button" onClick={onView}
            style={{ flex: 1, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-muted)", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            إظهار التفاصيل
          </button>
          <button type="button" onClick={onEdit}
            style={{ height: 34, padding: "0 0.875rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            تعديل
          </button>
          <button type="button" onClick={onDelete}
            style={{ height: 34, padding: "0 0.875rem", borderRadius: "var(--radius-md)", border: "1px solid #FECACA", background: "#FEF2F2", fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            أرشفة
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CarMaintenancePage() {
  const { carId } = useParams<{ carId: string }>();
  const router = useRouter();

  const { car } = useCarDetail(carId);
  const carLabel = car ? `${car.manufacturer} ${car.model} — ${car.plateLetters} ${car.plateNumber}` : undefined;

  const { records, loading, error, loadRecords, removeRecord, setError } = useCarMaintenanceList(carId);
  const { toast, notify } = useMaintenanceToast();

  const [formTarget, setFormTarget]     = useState<CarMaintenance | null | false>(false); // false = closed
  const [deleteTarget, setDeleteTarget] = useState<CarMaintenance | null>(null);
  const [archiveOpen, setArchiveOpen]   = useState(false);

  const getEditTarget = useCallback(
    () => (formTarget instanceof Object && formTarget !== null ? (formTarget as CarMaintenance) : null),
    [formTarget],
  );

  const { deleting, handleFormSubmit, handleDeleteConfirm } = useCarMaintenanceMutations({
    carId,
    onSuccess: (msg) => { notify({ type: "success", message: msg }); loadRecords(); },
    onError:   (msg) =>   notify({ type: "error", message: msg }),
    onDeleted: (id) => { removeRecord(id); setDeleteTarget(null); },
    getEditTarget,
  });

  return (
    <>
      <Toast notification={toast} />

      {formTarget !== false && (
        <CarMaintenanceFormModal
          editRecord={formTarget}
          carLabel={carLabel}
          onClose={() => setFormTarget(false)}
          onSubmit={(payload: CreateMaintenancePayload | UpdateMaintenancePayload, isNew: boolean) =>
            handleFormSubmit(payload, isNew).then(ok => { if (ok) setFormTarget(false); return ok; })
          }
        />
      )}

      {deleteTarget && (
        <CarMaintenanceDeleteModal
          record={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteConfirm(deleteTarget)}
        />
      )}

      {archiveOpen && (
        <ArchivedCarsMaintenanceModal
          carId={carId}
          carLabel={carLabel}
          onClose={() => setArchiveOpen(false)}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">
        <PageHeader
          title="سجل الصيانة"
          description={carLabel ?? "جارٍ تحميل بيانات المركبة…"}
          backHref="/dashboard/cars"
          backLabel="المركبات"
          action={
            <button type="button" onClick={() => setFormTarget(null)}
              style={{
                height: 40, padding: "0 1.125rem", borderRadius: "var(--radius-lg)",
                border: "none", background: "var(--color-brand-600)",
                fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 7,
                fontFamily: "var(--font-sans)", whiteSpace: "nowrap",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              إضافة سجل صيانة
            </button>
          }
        />

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "5rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="md" className="text-blue-600" />
            <span style={{ fontSize: 14 }}>جارٍ تحميل سجلات الصيانة…</span>
          </div>
        ) : records.length === 0 ? (
          <div style={{
            borderRadius: "var(--radius-xl)", border: "2px dashed var(--color-border)",
            background: "var(--color-surface)", padding: "5rem 2rem", textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔧</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>لا توجد سجلات صيانة بعد</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6 }}>
              اضغط على &quot;إضافة سجل صيانة&quot; لتسجيل أول عملية صيانة لهذه المركبة.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {records.map(record => (
              <MaintenanceCard
                key={record.id}
                record={record}
                onView={() => router.push(`/dashboard/cars/${carId}/maintenance/${record.id}`)}
                onEdit={() => setFormTarget(record)}
                onDelete={() => setDeleteTarget(record)}
              />
            ))}
          </div>
        )}
      </section>

      <ArchiveButton onClick={() => setArchiveOpen(true)} label="أرشيف الصيانة" />
    </>
  );
}