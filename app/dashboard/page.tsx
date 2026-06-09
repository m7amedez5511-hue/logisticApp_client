"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";
import { clearAuth, getStoredUser } from "../../lib/auth";
import { Spinner, Alert } from "../../Components/UI";

export default function DashboardPage() {
  const router = useRouter();
  const { data, error, loading } = useDashboardSummary();

  useEffect(() => {
    const storedUser = getStoredUser();
    const role = typeof storedUser?.role === "string" ? storedUser.role : "";
    if (!role || ["driver", "سائق"].includes(role)) {
      clearAuth();
      router.replace("/login");
    }
  }, [router]);

  const stats       = data?.stats;
  const alerts      = data?.alerts;
  const activeTrips = data?.activeTrips || [];

  const summaryCards = useMemo(
    () => [
      { label: "العملاء",  value: stats?.clients ?? 0,                         accent: "#06B6D4" },
      { label: "الطلبات",  value: stats?.orders ?? 0,                          accent: "#A78BFA" },
      { label: "الرحلات",  value: stats?.trips ?? 0,                           accent: "#34D399" },
      { label: "المركبات", value: (stats?.cars ?? 0) + (stats?.drivers ?? 0),  accent: "#FBBF24" },
    ],
    [stats],
  );

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
        <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "#67E8F9" }}>
          لوحة العمليات
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0 }}>
              ذكاء الأسطول في لمحة سريعة
            </h1>
            <p style={{ marginTop: "0.75rem", maxWidth: 680, color: "var(--color-text-dark-muted)", fontSize: 14, lineHeight: 1.6 }}>
              عرض واضح لطلبات الأسطول وتنبيهات السلامة وتقدم الرحلات.
            </p>
          </div>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(103,232,249,0.30)",
              background: "rgba(103,232,249,0.08)",
              padding: "0.5rem 1rem",
              fontSize: 13,
              color: "#CFFAFE",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "var(--transition-base)",
            }}
          >
            العودة إلى بوابة العميل
          </Link>
        </div>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-dark-muted)" }}>
          <Spinner size="sm" className="text-cyan-400" />
          <span style={{ fontSize: 14 }}>جارٍ تحميل البيانات…</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <Alert type="error" message={error}
          className="border-rose-400/30 bg-rose-500/10 text-rose-100" />
      )}

      {!loading && !error && (
        <>
          {/* ── Summary cards ── */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <article
                key={item.label}
                style={{
                  borderRadius: "var(--radius-2xl)",
                  border: "1px solid var(--color-border-dark)",
                  background: "var(--color-surface-dark-card)",
                  padding: "1.25rem",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ height: 3, borderRadius: 999, background: item.accent, marginBottom: "1rem" }} />
                <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-dark-muted)" }}>
                  {item.label}
                </p>
                <p style={{ fontSize: "2.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem" }}>
                  {item.value}
                </p>
              </article>
            ))}
          </div>

          {/* ── Active trips + alerts ── */}
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#67E8F9" }}>الرحلات النشطة</p>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem" }}>تقدم الرحلات</h2>
                </div>
                <span style={{ borderRadius: "var(--radius-full)", background: "rgba(52,211,153,0.10)", padding: "0.25rem 0.75rem", fontSize: 11, color: "#A7F3D0" }}>
                  مباشر
                </span>
              </div>
              <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {activeTrips.length ? activeTrips.map((trip) => (
                  <div key={trip.id} style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "1rem" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-dark-primary)" }}>{trip.tripNumber}</p>
                        <p style={{ fontSize: 13, color: "var(--color-text-dark-muted)" }}>{trip.title}</p>
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
                  <p style={{ fontSize: 13, color: "var(--color-text-dark-muted)" }}>لا توجد رحلات نشطة حالياً.</p>
                )}
              </div>
            </article>

            <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#FCD34D" }}>تنبيهات الالتزام</p>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem" }}>التجديدات القادمة</h2>
              <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {(alerts?.expiringCars || []).slice(0, 3).map((item, i) => (
                  <div key={`car-${i}`} style={{ borderRadius: "var(--radius-xl)", border: "1px solid rgba(251,191,36,0.20)", background: "rgba(251,191,36,0.06)", padding: "0.75rem 1rem", fontSize: 13, color: "var(--color-text-dark-primary)" }}>
                    {String((item as Record<string, unknown>).message || "Vehicle expiry alert")}
                  </div>
                ))}
                {(alerts?.expiringDrivers || []).slice(0, 3).map((item, i) => (
                  <div key={`driver-${i}`} style={{ borderRadius: "var(--radius-xl)", border: "1px solid rgba(251,113,133,0.20)", background: "rgba(244,63,94,0.06)", padding: "0.75rem 1rem", fontSize: 13, color: "var(--color-text-dark-primary)" }}>
                    {String((item as Record<string, unknown>).message || "Driver expiry alert")}
                  </div>
                ))}
                {(alerts?.upcomingMaint || []).slice(0, 3).map((item, i) => (
                  <div key={`maint-${i}`} style={{ borderRadius: "var(--radius-xl)", border: "1px solid rgba(103,232,249,0.20)", background: "rgba(103,232,249,0.06)", padding: "0.75rem 1rem", fontSize: 13, color: "var(--color-text-dark-primary)" }}>
                    {String((item as Record<string, unknown>).message || "Maintenance alert")}
                  </div>
                ))}
                {!(alerts?.expiringCars?.length || alerts?.expiringDrivers?.length || alerts?.upcomingMaint?.length) && (
                  <p style={{ fontSize: 13, color: "var(--color-text-dark-muted)" }}>لا توجد تنبيهات حالياً.</p>
                )}
              </div>
            </article>
          </div>

          {/* ── Security + endpoints ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C4B5FD" }}>الأمان</p>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem" }}>لمحة الحساب</h2>
              <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.875rem 1rem", fontSize: 13, color: "var(--color-text-dark-muted)" }}>
                  آخر تسجيل دخول: {data?.accountSecurity?.lastLogin || "—"}
                </div>
                <div style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.875rem 1rem", fontSize: 13, color: "var(--color-text-dark-muted)" }}>
                  بيانات الجهاز: {data?.accountSecurity?.requestMeta ? JSON.stringify(data.accountSecurity.requestMeta) : "—"}
                </div>
              </div>
            </article>

            <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6EE7B7" }}>خريطة الخلفية</p>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem" }}>النقاط النهائية</h2>
              <ul style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none", padding: 0 }}>
                {[
                  "/v1/dashboard/summary — نظرة عامة تشغيلية",
                  "/v1/client — إدارة العملاء",
                  "/v1/orders — دورة شحن الطلبات",
                  "/v1/trip — تنظيم الرحلات",
                ].map((ep) => (
                  <li key={ep} style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.875rem 1rem", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-dark-muted)" }}>
                    {ep}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </>
      )}
    </section>
  );
}