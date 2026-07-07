"use client";

import { useParams, useRouter } from "next/navigation";
import { Alert, PageHeader, Spinner } from "@/src/Components/UI";
import { useCarMaintenanceList } from "@/src/hooks/UseCarsMaintanance";
import {
  MAINTENANCE_STATUS_MAP,
  fmtDate,
  fmtCost,
  durationDays,
  getMaintenanceStatus,
} from "@/src/types/carMaintanance";

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", color: "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function CarMaintenanceDetailPage() {
  const { carId, maintenanceId } = useParams<{ carId: string; maintenanceId: string }>();
  const router = useRouter();

  // NOTE: GET /cars/:carId/maintenance/:maintenanceId isn't wired up on the
  // backend yet (returns "Route not found"), so this page resolves the
  // record from the already-loaded list instead of a dedicated single-record
  // call. includeDeleted: true so an archived record still resolves to a
  // real "مؤرشفة" status instead of silently disappearing.
  const { records, loading, error } = useCarMaintenanceList(carId, { includeDeleted: true });
  const record = records.find((r) => r.id === maintenanceId) ?? null;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 720, margin: "0 auto" }} dir="rtl">
      <PageHeader
        title="تفاصيل سجل الصيانة"
        description={record?.reason}
        backHref={`/dashboard/cars/${carId}/maintenance`}
        backLabel="العودة"
      />

      <div style={{
        borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
        background: "var(--color-surface)", boxShadow: "var(--shadow-card)", padding: "1.5rem",
      }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2rem 0" }}>
            <Spinner size="sm" className="text-blue-600" />
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>جارٍ التحميل…</span>
          </div>
        )}

        {error && <Alert type="error" message={error} />}

        {!loading && !error && !record && (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", padding: "2rem 0" }}>
            لم يتم العثور على سجل الصيانة.
          </p>
        )}

        {!loading && !error && record && (() => {
          const status = MAINTENANCE_STATUS_MAP[getMaintenanceStatus(record)];
          return (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                <span style={{ borderRadius: "var(--radius-full)", border: `1px solid ${status.border}`, background: status.bg, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: status.color }}>
                  {status.label}
                </span>
              </div>

              <DetailRow label="سبب الصيانة" value={record.reason} />
              <DetailRow label="التكلفة" value={fmtCost(record.cost)} />
              <DetailRow label="تاريخ البدء" value={fmtDate(record.startAt)} />
              <DetailRow label="تاريخ الانتهاء" value={fmtDate(record.endAt)} />
              <DetailRow label="المدة" value={`${durationDays(record.startAt, record.endAt)} يوم`} />
              {record.car && (
                <DetailRow label="المركبة" value={`${record.car.manufacturer} ${record.car.model} — ${record.car.plateLetters} ${record.car.plateNumber}`} mono />
              )}
              <DetailRow label="تاريخ الإضافة" value={fmtDate(record.createdAt)} />
              <DetailRow label="آخر تحديث" value={fmtDate(record.updatedAt)} />
            </>
          );
        })()}
      </div>

      <div>
        <button type="button" onClick={() => router.push(`/dashboard/cars/${carId}/maintenance`)}
          style={{ height: 40, padding: "0 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          العودة
        </button>
      </div>
    </section>
  );
}