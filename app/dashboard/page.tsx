"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useDashboardSummary } from "@/src/hooks/useDashboardSummary";
import { clearAuth, getStoredUser } from "@/src/lib/auth";
import { Spinner, Alert } from "@/src/Components/UI";

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
      { label: "المركبات و السائقين ", value: (stats?.cars ?? 0) + (stats?.drivers ?? 0),  accent: "#FBBF24" },
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
        <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "#67E8F9", textAlign: "start" }}>
          لوحة العمليات
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, color: "var(--color-text-dark-primary)", margin: 0, textAlign: "start" }}>
              ذكاء الأسطول في لمحة سريعة
            </h1>
            <p style={{ marginTop: "0.75rem", maxWidth: 680, color: "var(--color-text-dark-muted)", fontSize: 14, lineHeight: 1.6, textAlign: "start" }}>
              عرض واضح لطلبات الأسطول وتنبيهات السلامة وتقدم الرحلات.
            </p>
          </div>
         
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
                <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-dark-muted)", textAlign: "start" }}>
                  {item.label}
                </p>
                <p style={{ fontSize: "2.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>
                  {item.value}
                </p>
              </article>
            ))}
          </div>

          {/* ── Active trips + alerts ──
              Column order in the template below stays [trips, alerts] —
              same reading order as before. In RTL this now renders
              trips on the right (read first) and alerts on the left,
              which is the correct mirror; no class change needed (see
              grid + RTL note in the project report). */}
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
                      {/*
                        Progress fill: width % growing from the bar's
                        start edge is correct in both directions since
                        `width` itself is non-directional — the bar's
                        own inline-start (right, in RTL) is where the
                        fill begins, matching how the rest of the RTL
                        layout fills from the right. No change needed.
                      */}
                      <div style={{ height: 6, borderRadius: 999, width: `${trip.progress}%`, background: "linear-gradient(90deg,#06B6D4,#34D399)" }} />
                    </div>
                  </div>
                )) : (
                  <p style={{ fontSize: 13, color: "var(--color-text-dark-muted)", textAlign: "start" }}>لا توجد رحلات نشطة حالياً.</p>
                )}
              </div>
            </article>

            <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#FCD34D", textAlign: "start" }}>تنبيهات الالتزام</p>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>التجديدات القادمة</h2>
              <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {(alerts?.expiringCars || []).slice(0, 3).map((item, i) => (
                  <div key={`car-${i}`} style={{ borderRadius: "var(--radius-xl)", border: "1px solid rgba(251,191,36,0.20)", background: "rgba(251,191,36,0.06)", padding: "0.75rem 1rem", fontSize: 13, color: "var(--color-text-dark-primary)", textAlign: "start" }}>
                    {String((item as Record<string, unknown>).message || "Vehicle expiry alert")}
                  </div>
                ))}
                {(alerts?.expiringDrivers || []).slice(0, 3).map((item, i) => (
                  <div key={`driver-${i}`} style={{ borderRadius: "var(--radius-xl)", border: "1px solid rgba(251,113,133,0.20)", background: "rgba(244,63,94,0.06)", padding: "0.75rem 1rem", fontSize: 13, color: "var(--color-text-dark-primary)", textAlign: "start" }}>
                    {String((item as Record<string, unknown>).message || "Driver expiry alert")}
                  </div>
                ))}
                {(alerts?.upcomingMaint || []).slice(0, 3).map((item, i) => (
                  <div key={`maint-${i}`} style={{ borderRadius: "var(--radius-xl)", border: "1px solid rgba(103,232,249,0.20)", background: "rgba(103,232,249,0.06)", padding: "0.75rem 1rem", fontSize: 13, color: "var(--color-text-dark-primary)", textAlign: "start" }}>
                    {String((item as Record<string, unknown>).message || "Maintenance alert")}
                  </div>
                ))}
                {!(alerts?.expiringCars?.length || alerts?.expiringDrivers?.length || alerts?.upcomingMaint?.length) && (
                  <p style={{ fontSize: 13, color: "var(--color-text-dark-muted)", textAlign: "start" }}>لا توجد تنبيهات حالياً.</p>
                )}
              </div>
            </article>
          </div>

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
                  {/*
                    JSON.stringify output is structurally LTR (braces,
                    colons, commas read left-to-right regardless of
                    locale). Wrapping it in .ltr-embed prevents the
                    surrounding RTL paragraph from reordering the
                    punctuation — without this, nested objects can
                    render with their braces visually swapped.
                  */}
                  بيانات الجهاز: <span className="ltr-embed">{data?.accountSecurity?.requestMeta ? JSON.stringify(data.accountSecurity.requestMeta) : "—"}</span>
                </div>
              </div>
            </article>

            <article style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-card)", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6EE7B7", textAlign: "start" }}>خريطة الخلفية</p>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-dark-primary)", marginTop: "0.5rem", textAlign: "start" }}>النقاط النهائية</h2>
              <ul style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none", padding: 0 }}>
                {[
                  "/v1/dashboard/summary — نظرة عامة تشغيلية",
                  "/v1/client — إدارة العملاء",
                  "/v1/orders — دورة شحن الطلبات",
                  "/v1/trip — تنظيم الرحلات",
                ].map((ep) => (
                  <li key={ep} style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-dark)", background: "var(--color-surface-dark-raised)", padding: "0.875rem 1rem", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-dark-muted)", textAlign: "start" }}>
                    {/*
                      Each entry mixes an LTR API path with an Arabic
                      description. Splitting on the em-dash and
                      isolating only the path keeps the route string
                      from reading backwards while letting the Arabic
                      half flow naturally in the paragraph's own
                      direction.
                    */}
                    <span className="ltr-embed">{ep.split(" — ")[0]}</span>
                    {" — "}
                    {ep.split(" — ")[1]}
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