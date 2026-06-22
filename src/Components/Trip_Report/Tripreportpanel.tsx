"use client";

import { useState } from "react";
import { Spinner } from "../UI";
import { tripService } from "@/src/services/trip.service";
import { getStoredToken } from "@/src/lib/auth";

interface TripReportPanelProps {
  tripId: string;
}

export function TripReportPanel({ tripId }: TripReportPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await tripService.getReport(tripId, token);
      const reportUrl = (res as unknown as { data: { reportUrl: string } }).data?.reportUrl;

      if (!reportUrl) throw new Error("لم يتم إرجاع رابط التقرير.");
      window.open(reportUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إنشاء التقرير.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "1.5rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-muted)",
        padding: "1rem",
      }}
    >
      <p style={{
        fontSize: 11,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "#2563EB",
        fontWeight: 700,
        margin: "0 0 0.75rem",
      }}>
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

      {error && (
        <div
          style={{
            marginTop: "0.75rem",
            borderRadius: "var(--radius-md)",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            padding: "0.625rem 0.875rem",
            fontSize: 12,
            color: "#DC2626",
            fontWeight: 500,
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
}