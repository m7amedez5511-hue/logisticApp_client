"use client";

import { useState } from "react";
import { Alert, Button, Input } from "../UI";
import { driverService } from "@/src/services/driver.service";
import { getStoredToken } from "@/src/lib/auth";

interface DriverReportPanelProps {
  driverId: string;
}

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
      const { reportUrl } = await driverService.getDailyReport(driverId, date, token);

      if (!reportUrl) throw new Error("لم يتم إرجاع رابط التقرير.");

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
        <div style={{ flex: 1, minWidth: 140 }}>
          <Input
            label="تاريخ التقرير"
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
          />
        </div>

        <Button onClick={handleGenerate} disabled={!date} loading={loading}>
          {loading ? "جارٍ الإنشاء…" : "إنشاء التقرير"}
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mt-3"
        />
      )}
    </div>
  );
}