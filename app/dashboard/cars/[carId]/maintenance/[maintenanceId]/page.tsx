"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, ArchiveButton, Button, ConfirmDialog, EmptyState, PageHeader, Spinner, Toast } from "@/src/Components/UI";
import { CarMaintenanceFormModal } from "@/src/Components/Car_Maintanance/CarMaintananceFormModal";
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

  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
  <Button variant="secondary" size="sm" onClick={onEdit}>
    تعديل
  </Button>
  {/* inline style keeps the original light-red look; Button's own
      variant="danger" is solid red and would change the visual */}
  <Button
    variant="secondary"
    size="sm"
    onClick={onDelete}
    style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}
  >
    أرشفة
  </Button>
</div>
      </div>
    </article>
  );
}

export default function CarMaintenancePage() {
  const { carId } = useParams<{ carId: string }>();
  const router = useRouter();

  const { car, refetch: refetchCar } = useCarDetail(carId);
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
    onSuccess: (msg) => { notify({ type: "success", message: msg }); loadRecords(); refetchCar(); },
    onError:   (msg) =>   notify({ type: "error", message: msg }),
    onDeleted: (id) => { removeRecord(id); setDeleteTarget(null); refetchCar(); },
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

      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteConfirm(deleteTarget)}
        title="حذف سجل الصيانة"
        description={`هل أنت متأكد من حذف سجل ${deleteTarget?.reason ?? ""} (${deleteTarget ? fmtCost(deleteTarget.cost) : ""})؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

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
            <Button onClick={() => setFormTarget(null)}>
              <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              إضافة سجل صيانة
            </Button>
          }
        />

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "5rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="md" className="text-blue-600" />
            <span style={{ fontSize: 14 }}>جارٍ تحميل سجلات الصيانة…</span>
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon="🔧"
            title="لا توجد سجلات صيانة بعد"
            description='اضغط على "إضافة سجل صيانة" لتسجيل أول عملية صيانة لهذه المركبة.'
          />
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