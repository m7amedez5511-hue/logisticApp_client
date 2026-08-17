"use client";

import { EmptyState, Spinner } from "@/src/Components/UI";
import type { TrendSeries } from "@/src/types/dashboard";

function MiniTrendChart({ series }: { series: TrendSeries }) {
  const { points, deltaPercent, title } = series;
  if (!points.length) return null;

  const width = 300;
  const height = 64;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - ((p.value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = deltaPercent >= 0;

  return (
    <div style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "1rem" }}>
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 12, color: "var(--color-text-dark-muted)", margin: 0 }}>{title}</p>
        <span
          style={{
            fontSize: 11, fontWeight: 700,
            color: isUp ? "#6EE7B7" : "#FCA5A5",
            background: isUp ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
            border: `1px solid ${isUp ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
            borderRadius: "var(--radius-full)",
            padding: "0.1rem 0.5rem",
          }}
        >
          {isUp ? "▲" : "▼"} {Math.abs(deltaPercent).toFixed(1)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="96" preserveAspectRatio="none" style={{ marginTop: 8 }}>
        <polyline points={coords} fill="none" stroke={isUp ? "#34D399" : "#F87171"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

interface TrendChartsPanelProps {
  series: TrendSeries[];
  loading: boolean;
}

export function TrendChartsPanel({ series, loading }: TrendChartsPanelProps) {
  return (
    <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6EE7B7", textAlign: "start" }}>
            الاتجاهات
          </p>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>
            أداء آخر ٧ أيام
          </h2>
        </div>
        {loading && <Spinner size="sm" className="text-cyan-400" />}
      </div>

      <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {!loading && series.length === 0 && (
          <EmptyState icon="📈" title="لا توجد بيانات اتجاه بعد" description="سيتم عرض الرسوم البيانية عند توفر بيانات كافية." />
        )}
        {series.map((s) => (
          <MiniTrendChart key={s.key} series={s} />
        ))}
      </div>
    </article>
  );
}