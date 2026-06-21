"use client";

import { useState } from "react";
import { Spinner } from "../UI";
import { driverService } from "../../services/driver.service";
import { getStoredToken } from "../../lib/auth";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DriverReportPanelProps {
  driverId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DriverReportPanel({ driverId }: DriverReportPanelProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await driverService.getDailyReport(driverId, date, token);
      // The response shape: { data: { reportUrl, filename } }
      const reportUrl = (
        res as unknown as { data: { reportUrl: string; filename: string } }
      ).data?.reportUrl;

      if (!reportUrl) throw new Error("لم يتم إرجاع رابط التقرير.");

      // Navigate directly to the report URL
      window.location.href = reportUrl;
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
      {/* Heading */}
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
        إنشاء تقرير يومي
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        {/* Date input */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <label
            htmlFor="report-date"
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: 4,
            }}
          >
            تاريخ التقرير
          </label>
          <input
            id="report-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
            style={{
              width: "100%",
              height: 38,
              padding: "0 0.625rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13,
              color: "var(--color-text-primary)",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !date}
          style={{
            height: 38,
            padding: "0 1rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            color: "#FFF",
            background: !date || loading
              ? "var(--color-brand-400)"
              : "var(--color-brand-600)",
            cursor: !date || loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
          }}
        >
          {loading && <Spinner size="sm" className="text-white" />}
          {loading ? "جارٍ الإنشاء…" : "إنشاء التقرير"}
        </button>
      </div>

      {/* Error */}
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