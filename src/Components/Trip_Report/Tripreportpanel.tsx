"use client";

import { useRef, useState } from "react";
import { Spinner } from "../UI";
import { Toast } from "../UI/Toast";
import { tripService } from "@/src/services/trip.service";
import { getStoredToken } from "@/src/lib/auth";
import type { TripNotification } from "@/src/hooks/useTrip";

interface TripReportPanelProps {
  tripId: string;
}

// Extracts a readable message from any error shape the API might return.
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
      const res   = await tripService.getReport(tripId, token);
      const url   = (res as unknown as { data: { reportUrl: string } }).data?.reportUrl;

      if (!url) {
        notify({ type: "error", message: "لم يتم إرجاع رابط التقرير من الخادم." });
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
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

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          style={{
            height: 38,
            padding: "0 1.25rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            color: "#FFF",
            background: loading ? "var(--color-brand-400)" : "var(--color-brand-600)",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
          }}
        >
          {loading && <Spinner size="sm" className="text-white" />}
          {loading ? "جارٍ الإنشاء…" : "إنشاء تقرير البيان"}
        </button>
      </div>

      {/* Toast scoped to this panel — sits at the bottom of the screen */}
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