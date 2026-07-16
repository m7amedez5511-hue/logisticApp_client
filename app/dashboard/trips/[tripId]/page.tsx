"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConfirmDialog, Spinner } from "@/src/Components/UI";
import { TripFormModal } from "@/src/Components/Trip/Tripformmodal";
import { TripReportPanel } from "@/src/Components/Trip_Report/Tripreportpanel";
import { tripService } from "@/src/services/trip.service";
import { getStoredToken } from "@/src/lib/auth";
import type { Trip, CreateTripPayload, UpdateTripPayload } from "@/src/types/trip";
import { TRIP_STATUS_MAP } from "@/src/types/trip";
import { Toast, type ToastNotification } from "@/src/Components/UI/Toast";

// ── API error extractor ────────────────────────────────────────────────────
// Same shape-walking logic as useTrip.ts — duplicated here on purpose so this
// page no longer depends on the list hook for a single piece of UI feedback.

function extractApiMessage(err: unknown, fallback: string): string {
  if (typeof err === "string" && err.trim()) return err.trim();

  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const responseData = (e["response"] as Record<string, unknown> | undefined)?.["data"];
    if (responseData && typeof responseData === "object") {
      const rd = responseData as Record<string, unknown>;
      if (typeof rd["message"] === "string" && rd["message"].trim()) return rd["message"];
      if (Array.isArray(rd["message"])) return (rd["message"] as string[]).join(" — ");
      if (typeof rd["error"] === "string" && rd["error"].trim()) return rd["error"];
    }
    if (typeof e["message"] === "string" && e["message"].trim()) return e["message"];
  }

  return fallback;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          padding: "0.875rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--color-text-hint)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {title}
        </p>
      </div>
      <div style={{ padding: "1rem 1.5rem" }}>{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  warn = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "0.55rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          color: warn ? "#D97706" : "var(--color-text-primary)",
          fontWeight: warn ? 600 : 400,
          maxWidth: "60%",
          textAlign: "left",
          wordBreak: "break-word",
        }}
      >
        {warn && value !== "—" ? "⚠ " : ""}
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params?.tripId as string;

  const [trip, setTrip]       = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [editOpen, setEditOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // ── Notifications (standalone — no longer borrowed from the list hook) ───
  const [notification, setNotification] = useState<ToastNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((n: ToastNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(n);
    timerRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  const dismissNotification = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── Load trip ─────────────────────────────────────────────────────────────
  const loadTrip = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await tripService.getById(tripId, token);
      setTrip((res as unknown as { data: Trip }).data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل بيانات الرحلة.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    queueMicrotask(loadTrip);
  }, [loadTrip]);

  // ── Edit submit ───────────────────────────────────────────────────────────
  const handleEditSubmit = useCallback(
    async (
      payload: CreateTripPayload | UpdateTripPayload,
    ): Promise<boolean> => {
      if (!trip) return false;
      try {
        const token = getStoredToken();
        const res = await tripService.update(trip.id, payload as UpdateTripPayload, token);
        const updated = (res as unknown as { data: Trip }).data;
        setTrip(updated);
        notify({ type: "success", message: "تم تحديث بيانات الرحلة بنجاح." });
        return true;
      } catch (err) {
        notify({ type: "error", message: extractApiMessage(err, "تعذّر تحديث الرحلة.") });
        return false;
      }
    },
    [trip, notify],
  );

  // ── Delete confirm ────────────────────────────────────────────────────────
  const handleConfirmDelete = useCallback(async () => {
    if (!trip) return;
    setDeleting(true);
    try {
      const token = getStoredToken();
      await tripService.delete(trip.id, token);
      router.push("/dashboard/trips");
    } catch (err) {
      notify({ type: "error", message: extractApiMessage(err, "تعذّر حذف الرحلة.") });
      setDeleting(false);
    }
  }, [trip, router, notify]);

  // ── Status config ─────────────────────────────────────────────────────────
  const statusConfig = trip ? TRIP_STATUS_MAP[trip.status] : null;

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "6rem 0",
          color: "var(--color-text-muted)",
        }}
      >
        <Spinner size="sm" className="text-blue-600" />
        <span style={{ fontSize: 14 }}>جارٍ التحميل…</span>
      </div>
    );
  }

  // ── Render: Error ─────────────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "4rem auto",
          borderRadius: "var(--radius-xl)",
          border: "1px solid #FECACA",
          background: "#FEF2F2",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 14, color: "#DC2626", fontWeight: 600 }}>
          ⚠ {error ?? "الرحلة غير موجودة"}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            marginTop: "1rem",
            height: 38,
            padding: "0 1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          ← رجوع
        </button>
      </div>
    );
  }

  // ── Render: Trip detail ────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toast notification ── */}
      <Toast notification={notification} onDismiss={dismissNotification} />

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Page header ── */}
        <header
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "1.5rem 2rem",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Back link */}
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: "1rem",
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            العودة إلى قائمة الرحلات
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            {/* Icon + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "2px solid var(--color-brand-200)",
                  background: "var(--color-surface-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 700, color: "var(--color-brand-600)" }}>
                  {trip.title.charAt(0)}
                </span>
              </div>

              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
                  ملف الرحلة
                </p>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
                  {trip.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                    #{trip.tripNumber}
                  </span>
                  {statusConfig && (
                    <span
                      style={{
                        borderRadius: "var(--radius-full)",
                        border: `1px solid ${statusConfig.border}`,
                        background: statusConfig.bg,
                        padding: "0.2rem 0.625rem",
                        fontSize: 11,
                        fontWeight: 700,
                        color: statusConfig.color,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusConfig.dot, flexShrink: 0 }} />
                      {statusConfig.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                style={{
                  height: 40,
                  padding: "0 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#DC2626",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                حذف الرحلة
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                style={{
                  height: 40,
                  padding: "0 1.25rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--color-brand-600)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-sans)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                تعديل الرحلة
              </button>
            </div>
          </div>
        </header>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" }}>
          <StatCard label="المجمّع" value={trip.collectedCount} color="var(--color-brand-600)" />
          <StatCard label="المُسلَّم" value={trip.deliveredCount} color="#16A34A" />
          <StatCard label="المُرتجع" value={trip.returnedCount} color="#D97706" />
          <StatCard
            label="النقد المحصّل"
            value={trip.totalCashCollected != null ? `${Number(trip.totalCashCollected).toLocaleString("ar-SA")} ر.س` : "—"}
            color="#7C3AED"
          />
        </div>

        {/* ── Content grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          {/* Trip Info */}
          <SectionCard title="بيانات الرحلة">
            <DetailRow label="وقت البدء"    value={fmtDateTime(trip.startTime)} />
            <DetailRow label="وقت الانتهاء" value={fmtDateTime(trip.endTime)} />
            <DetailRow label="الفرع"        value={trip.branch?.name ?? "—"} />
            {trip.notes    && <DetailRow label="ملاحظات"    value={trip.notes} />}
            {trip.endReason && <DetailRow label="سبب الإنهاء" value={trip.endReason} warn />}
          </SectionCard>

          {/* Driver */}
          {trip.driver && (
            <SectionCard title="بيانات السائق">
              <DetailRow label="الاسم"        value={trip.driver.name} />
              <DetailRow label="الجوال"       value={trip.driver.phone} mono />
              <DetailRow label="اسم المستخدم" value={trip.driver.userName ?? "—"} mono />
              <DetailRow label="البريد"       value={trip.driver.email ?? "—"} />
              <DetailRow label="الجنسية"      value={trip.driver.nationality ?? "—"} />
              <DetailRow label="رخصة القيادة" value={trip.driver.licenseNumber ?? "—"} mono />
              <DetailRow label="بطاقة السائق" value={trip.driver.driverCardNumber ?? "—"} mono />
              <DetailRow label="رقم GOSI"     value={trip.driver.gosiNumber ?? "—"} mono />
            </SectionCard>
          )}

          {/* Car */}
          {trip.car && (
            <SectionCard title="بيانات السيارة">
              <DetailRow label="الشركة"      value={trip.car.manufacturer} />
              <DetailRow label="الموديل"     value={trip.car.model} />
              <DetailRow label="السنة"       value={trip.car.year != null ? String(trip.car.year) : "—"} />
              <DetailRow label="اللون"       value={trip.car.color ?? "—"} />
              <DetailRow label="رقم اللوحة"  value={trip.car.plateNumber} mono />
              <DetailRow label="حروف اللوحة" value={trip.car.plateLetters ?? "—"} mono />
              <DetailRow label="رقم التسجيل" value={trip.car.registrationNumber ?? "—"} mono />
            </SectionCard>
          )}

          {/* System Info */}
          <SectionCard title="معلومات النظام">
            <DetailRow label="رقم الرحلة"    value={trip.tripNumber} mono />
            <DetailRow label="تاريخ الإنشاء" value={fmtDate(trip.createdAt)} />
            <DetailRow label="آخر تحديث"     value={fmtDate(trip.updatedAt)} />
          </SectionCard>
        </div>

        {/* ── Report section (full width) ── */}
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-card)",
            padding: "1.5rem",
          }}
        >
          <TripReportPanel tripId={trip.id} />
        </div>

      </section>

      {/* ── Edit modal ── */}
      {editOpen && (
        <TripFormModal
          editTrip={trip}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* ── Delete modal ── */}
      <ConfirmDialog
        open={deleteOpen}
        loading={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="حذف الرحلة"
        description={`هل أنت متأكد من حذف رحلة ${trip.title} (${trip.tripNumber})؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </>
  );
}