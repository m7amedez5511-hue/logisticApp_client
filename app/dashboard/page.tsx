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
      { label: "العملاء",   value: stats?.clients ?? 0,                          tone: "from-cyan-500 to-sky-600" },
      { label: "الطلبات",   value: stats?.orders ?? 0,                           tone: "from-violet-500 to-fuchsia-600" },
      { label: "الرحلات",   value: stats?.trips ?? 0,                            tone: "from-emerald-500 to-green-600" },
      { label: "المركبات",  value: (stats?.cars ?? 0) + (stats?.drivers ?? 0),  tone: "from-amber-400 to-orange-500" },
    ],
    [stats],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#111827_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">

        {/* ── Header ─────────────────────────────────────── */}
        <header className="rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">لوحة العمليات</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white lg:text-4xl">ذكاء الأسطول في لمحة سريعة</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                هذه الشاشة متوافقة مع نقطة ملخص لوحة الإدارة في الخلفية وتوفر عرضًا واضحًا لطلب الأسطول،
                وتنبيهات السلامة، وتقدم الرحلات.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
            >
              العودة إلى بوابة العميل
            </Link>
          </div>
        </header>

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center gap-3 text-slate-300">
            <Spinner size="sm" className="text-cyan-400" />
            <span>جارٍ تحميل مقاييس الخلفية…</span>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {error && (
          <Alert
            type="error"
            message={error}
            className="border-rose-400/30 bg-rose-500/10 text-rose-100"
          />
        )}

        {/* ── Content ─────────────────────────────────────── */}
        {!loading && !error && (
          <>
            {/* Summary cards */}
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((item) => (
                <article
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20"
                >
                  <div className={`h-2 rounded-full bg-linear-to-r ${item.tone}`} />
                  <p className="mt-4 text-sm uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-4xl font-semibold text-white">{item.value}</p>
                </article>
              ))}
            </section>

            {/* Active trips + alerts */}
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">الرحلات النشطة</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">تقدم الرحلات</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    مباشر من /dashboard/summary
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {activeTrips.length ? (
                    activeTrips.map((trip) => (
                      <div key={trip.id} className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{trip.tripNumber}</p>
                            <p className="text-sm text-slate-300">{trip.title}</p>
                          </div>
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                            {trip.progress}%
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-700">
                          <div
                            className="h-2 rounded-full bg-linear-to-r from-cyan-400 to-emerald-400"
                            style={{ width: `${trip.progress}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">لا توجد رحلات في-progress حالياً.</p>
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.25em] text-amber-200">تنبيهات الالتزام</p>
                <h2 className="mt-2 text-xl font-semibold text-white">التجديدات القادمة</h2>
                <div className="mt-6 space-y-4 text-sm text-slate-200">
                  {(alerts?.expiringCars || []).slice(0, 3).map((item, i) => (
                    <div key={`car-${i}`} className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4">
                      {String((item as Record<string, unknown>).message || "Vehicle expiry alert")}
                    </div>
                  ))}
                  {(alerts?.expiringDrivers || []).slice(0, 3).map((item, i) => (
                    <div key={`driver-${i}`} className="rounded-2xl border border-rose-400/20 bg-rose-500/8 p-4">
                      {String((item as Record<string, unknown>).message || "Driver expiry alert")}
                    </div>
                  ))}
                  {(alerts?.upcomingMaint || []).slice(0, 3).map((item, i) => (
                    <div key={`maint-${i}`} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4">
                      {String((item as Record<string, unknown>).message || "Maintenance alert")}
                    </div>
                  ))}
                </div>
              </article>
            </section>

            {/* Security + endpoints */}
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.25em] text-violet-200">الأمان</p>
                <h2 className="mt-2 text-xl font-semibold text-white">لمحة الحساب</h2>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-sm text-slate-200">
                    آخر تسجيل دخول: {data?.accountSecurity?.lastLogin || "لم يتم العثور على حدث تسجيل دخول"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-sm text-slate-200">
                    بيانات الجهاز:{" "}
                    {data?.accountSecurity?.requestMeta
                      ? JSON.stringify(data.accountSecurity.requestMeta)
                      : "غير متاح"}
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">خريطة الخلفية</p>
                <h2 className="mt-2 text-xl font-semibold text-white">النقاط النهائية المستندة إلى Swagger</h2>
                <ul className="mt-6 grid gap-3 text-sm text-slate-200">
                  {[
                    "/v1/dashboard/summary — نظرة عامة تشغيلية",
                    "/v1/client — إدارة العملاء",
                    "/v1/orders — دورة شحن الطلبات",
                    "/v1/trip — تنظيم الرحلات",
                  ].map((ep) => (
                    <li key={ep} className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">
                      {ep}
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}