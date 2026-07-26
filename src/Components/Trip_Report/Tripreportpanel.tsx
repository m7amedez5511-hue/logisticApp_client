"use client";

import { useRef, useState } from "react";
import { Button, Toast } from "../UI";
import { tripService } from "@/src/services/trip.service";
import { getStoredToken } from "@/src/lib/auth";
import type { TripNotification } from "@/src/hooks/useTrip";

interface TripReportPanelProps {
  tripId: string;
}

function extractApiMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const rd = (e["response"] as Record<string, unknown> | undefined)?.["data"];
    if (rd && typeof rd === "object") {
      const msg = (rd as Record<string, unknown>)["message"];
      if (typeof msg === "string" && msg.trim()) return msg;
    }
    if (typeof e["message"] === "string" && e["message"].trim()) return e["message"];
  }
  return fallback;
}

export function TripReportPanel({ tripId }: TripReportPanelProps) {
  const [loading, setLoading]           = useState(false);
  const [notification, setNotification] = useState<TripNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (n: TripNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(n);
    timerRef.current = setTimeout(() => setNotification(null), 4000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const { reportUrl } = await tripService.getReport(tripId, token);

      if (!reportUrl) {
        notify({ type: "error", message: "لم يتم إرجاع رابط التقرير من الخادم." });
        return;
      }

      window.open(reportUrl, "_blank", "noopener,noreferrer");
      notify({ type: "success", message: "تم إنشاء التقرير بنجاح." });
    } catch (err) {
      notify({ type: "error", message: extractApiMessage(err, "تعذّر إنشاء التقرير.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          marginTop: "1.5rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          padding: "1rem",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#2563EB",
            fontWeight: 700,
            margin: "0 0 0.75rem",
          }}
        >
          إنشاء تقرير الرحلة
        </p>

        <Button type="button" onClick={handleGenerate} loading={loading}>
          {loading ? "جارٍ الإنشاء…" : "إنشاء تقرير البيان"}
        </Button>
      </div>

      <Toast
        notification={notification}
        onDismiss={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          setNotification(null);
        }}
      />
    </>
  );
}