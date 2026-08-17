"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearAuth, getStoredUser } from "@/src/lib/auth";
import { Spinner, Alert } from "@/src/Components/UI";
import { useDashboardOverview } from "@/src/hooks/useDashboardOverview";
import {
  KpiSection,
  AlertsSection,
  RecentActivityPanel,
  TrendChartsPanel,
  QuickAccessFooter,
} from "@/src/Components/Dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { data, error, loading } = useDashboardOverview();

  useEffect(() => {
    const storedUser = getStoredUser();
    const role = typeof storedUser?.role === "string" ? storedUser.role : "";
    if (!role || ["driver", "سائق"].includes(role)) {
      clearAuth();
      router.replace("/login");
    }
  }, [router]);

  const activeTrips = data?.activeTrips || [];

  return (
    <section className="flex flex-col gap-6">

      {/* ── Header ── */}
      <header
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--color-border-dark)",
          borderRadius: "var(--radius-2xl)",
          padding: "2rem",
          boxShadow: "var(--shadow-overlay)",
          backdropFilter: "blur(16px)",
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "#67E8F9", textAlign: "start" }}>
          لوحة العمليات
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0, textAlign: "start" }}>
              ذكاء الأسطول في لمحة سريعة
            </h1>
            <p style={{ marginTop: "0.75rem", maxWidth: 680, color: "var(--color-text-dark-muted)", fontSize: 14, lineHeight: 1.6, textAlign: "start" }}>
              عرض واضح لكل وحدة من وحدات المنصة، مع تنبيهات فورية واتجاهات الأداء.
            </p>
          </div>
        </div>
      </header>

      {/* ── Loading ── */}
      {loading && !data && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-dark-muted)" }}>
          <Spinner size="sm" className="text-cyan-400" />
          <span style={{ fontSize: 14 }}>جارٍ تحميل البيانات…</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <Alert type="error" message={error} className="border-rose-400/30 bg-rose-500/10 text-rose-100" />
      )}

      {/* ── KPI Section: total / active / pending per entity (9 cards) ── */}
      <KpiSection entities={data?.entities ?? []} loading={loading && !data} />

      {/* ── Alerts Section: urgent cross-entity issues ── */}
      <AlertsSection alerts={data?.alerts ?? []} loading={loading && !data} />

      {/* ── Insights Row: recent activity log + trend charts ── */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <RecentActivityPanel logs={data?.recentActivity ?? []} loading={loading && !data} />
        <TrendChartsPanel series={data?.trends ?? []} loading={loading && !data} />
      </div>

      {/* ── Quick access to every entity page (minimizes navigation clicks) ── */}
      <QuickAccessFooter />

      {/* ── Active trips (kept from the previous layout — live operational detail) ── */}
      <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#67E8F9", textAlign: "start" }}>الرحلات النشطة</p>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>تقدم الرحلات</h2>
          </div>
          <span style={{ borderRadius: "var(--radius-full)", background: "rgba(52,211,153,0.10)", padding: "0.25rem 0.75rem", fontSize: 11, color: "#008000" }}>
            مباشر
          </span>
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activeTrips.length ? activeTrips.map((trip) => (
            <div key={trip.id} style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "1rem" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-dark-primary)", textAlign: "start" }}>
                    <span className="ltr-embed">{trip.tripNumber}</span>
                  </p>
                  <p style={{ fontSize: 13, color: "var(--color-text-dark-muted)", textAlign: "start" }}>{trip.title}</p>
                </div>
                <span style={{ borderRadius: "var(--radius-full)", background: "rgba(103,232,249,0.10)", padding: "0.25rem 0.75rem", fontSize: 11, color: "#CFFAFE" }}>
                  {trip.progress}%
                </span>
              </div>
              <div style={{ marginTop: "0.75rem", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: 6, borderRadius: 999, width: `${trip.progress}%`, background: "linear-gradient(90deg,#06B6D4,#34D399)" }} />
              </div>
            </div>
          )) : (
            <p style={{ fontSize: 13, color: "var(--color-text-dark-muted)", textAlign: "start" }}>لا توجد رحلات نشطة حالياً.</p>
          )}
        </div>
      </article>

      {/* ── Security + endpoints ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C4B5FD", textAlign: "start" }}>الأمان</p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>لمحة الحساب</h2>
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.875rem 1rem", fontSize: 13, color: "var(--color-text-dark-muted)", textAlign: "start" }}>
              آخر تسجيل دخول: <span className="ltr-embed">{data?.accountSecurity?.lastLogin || "—"}</span>
            </div>
            <div style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.875rem 1rem", fontSize: 13, color: "var(--color-text-dark-muted)", textAlign: "start" }}>
              بيانات الجهاز: <span className="ltr-embed">{data?.accountSecurity?.requestMeta ? JSON.stringify(data.accountSecurity.requestMeta) : "—"}</span>
            </div>
          </div>
        </article>

        <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6EE7B7", textAlign: "start" }}>خريطة الخلفية</p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>النقاط النهائية</h2>
          <ul style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none", padding: 0 }}>
            {[
              "/v1/dashboard/overview — نظرة عامة تشغيلية",
              "/v1/client — إدارة العملاء",
              "/v1/orders — دورة شحن الطلبات",
              "/v1/trip — تنظيم الرحلات",
            ].map((ep) => (
              <li key={ep} style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.875rem 1rem", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-dark-muted)", textAlign: "start" }}>
                <span className="ltr-embed">{ep.split(" — ")[0]}</span>
                {" — "}
                {ep.split(" — ")[1]}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}