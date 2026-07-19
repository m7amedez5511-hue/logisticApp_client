"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner, EmptyState, Badge, PageHeader } from "@/src/Components/UI";
import { tripService } from "@/src/services/trip.service";
import { getStoredToken } from "@/src/lib/auth";
import type { Trip } from "@/src/types/trip";
import { TRIP_STATUS_MAP } from "@/src/types/trip";

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
}

export default function ArchivedTripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getStoredToken();
        const data = await tripService.getArchivedById(tripId, token);
        if (!cancelled) setTrip(data);
      } catch {
        if (!cancelled) setError("لم يتم العثور على هذه الرحلة في الأرشيف.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-[var(--color-text-muted)]">
        <Spinner size="sm" />
        <span className="text-sm">جارٍ التحميل…</span>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <EmptyState
        icon="🗄️"
        title="الرحلة غير موجودة في الأرشيف"
        description={error ?? "تعذّر العثور على رحلة بهذا المعرّف."}
        action={
          <button
            onClick={() => router.push("/dashboard/trips")}
            className="text-sm font-semibold text-[var(--color-brand-600)] underline"
          >
            العودة إلى قائمة الرحلات
          </button>
        }
      />
    );
  }

  const statusConfig = TRIP_STATUS_MAP[trip.status];

  return (
    <section className="flex flex-col gap-6 p-6" dir="rtl">
      <PageHeader
        title={trip.title}
        description={`رقم الرحلة: ${trip.tripNumber}`}
        backHref="/dashboard/trips"
        backLabel="الرحلات"
        action={<Badge label="مؤرشفة" color="amber" />}
      />

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <Badge label={statusConfig.label} color="slate" />
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[var(--color-text-muted)]">وقت البدء</dt>
            <dd>{fmtDateTime(trip.startTime)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">وقت الانتهاء</dt>
            <dd>{fmtDateTime(trip.endTime)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">تاريخ الأرشفة</dt>
            <dd>{fmtDateTime(trip.deletedAt)}</dd>
          </div>
          {trip.driver && (
            <div>
              <dt className="text-[var(--color-text-muted)]">السائق</dt>
              <dd>{trip.driver.name}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}