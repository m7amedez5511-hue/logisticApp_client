"use client";


import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spinner } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { tripService } from "@/src/services/trip.service";
import { TRIP_STATUS_MAP } from "@/src/types/trip";
import type { Trip } from "@/src/types/trip";

interface TripDetailModalProps {
  tripId:  string;
  onClose: () => void;
}

// ── small helper components ───────────────────────────────────────────────────
// (No shared-UI equivalents — purpose-built layouts, not generic controls.)
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "0.75rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: value ? "var(--color-text-primary)" : "var(--color-text-hint)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: Trip["status"] }) {
  const s = TRIP_STATUS_MAP[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      borderRadius: "var(--radius-full)",
      border: `1px solid ${s.border}`,
      background: s.bg,
      padding: "0.25rem 0.75rem",
      fontSize: 12, fontWeight: 600,
      color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function TripDetailModal({ tripId, onClose }: TripDetailModalProps) {
  const [trip,    setTrip]    = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // fetch trip details on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const data = await tripService.getById(tripId, token);
        if (!cancelled) setTrip(data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات الرحلة. يرجى المحاولة لاحقاً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tripId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  const cash = (v?: number | string | null) =>
    v != null ? `${Number(v).toLocaleString("ar-SA")} ر.س` : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      open
      title={trip?.title ?? "عرض الرحلة"}
      subtitle="تفاصيل الرحلة"
      onClose={onClose}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {/* loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      )}

      {/* error */}
      {!loading && error && <Alert type="error" message={error} />}

      {/* content */}
      {!loading && trip && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }} dir="rtl">

          {/* title + trip number + status row */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            padding: "0 0 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "0.25rem",
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{trip.title}</p>
            <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
              {trip.tripNumber}
            </p>
            <StatusBadge status={trip.status} />
          </div>

          {/* driver / car / branch */}
          <DetailRow label="السائق"  value={trip.driver?.name} />
          <DetailRow label="السيارة" value={trip.car ? `${trip.car.manufacturer} ${trip.car.model} — ${trip.car.plateNumber}` : null} />
          <DetailRow label="الفرع"   value={trip.branch?.name} />

          {/* timing */}
          <DetailRow label="وقت البدء"    value={fmt(trip.startTime)} />
          <DetailRow label="وقت الانتهاء" value={fmt(trip.endTime)} />

          {/* counts + cash */}
          <DetailRow label="المجمّع"        value={String(trip.collectedCount)} />
          <DetailRow label="المُسلَّم"      value={String(trip.deliveredCount)} />
          <DetailRow label="المُرتجع"       value={String(trip.returnedCount)} />
          <DetailRow label="النقد المحصّل"  value={cash(trip.totalCashCollected)} />

          {/* notes */}
          <DetailRow label="ملاحظات"    value={trip.notes} />
          <DetailRow label="سبب الإنهاء" value={trip.endReason} />

          {/* timestamps */}
          <DetailRow label="تاريخ الإنشاء" value={fmt(trip.createdAt)} />
          <DetailRow label="آخر تحديث"     value={fmt(trip.updatedAt)} />
        </div>
      )}
    </Modal>
  );
}