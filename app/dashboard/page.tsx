"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDashboardSummary, type DashboardSummaryResponse } from "../../src/lib/api";
import { clearAuth, getStoredToken, getStoredUser } from "../../src/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    
    // FIX: Implement role-based access control by checking the authenticated user's role from localStorage. Only users with "user" or "admin" roles can access the dashboard. If the role is missing or not allowed, clear the auth state and redirect to login.
    const storedUser = getStoredUser(); // add this import at top of file
    const role = typeof storedUser?.role === "string" ? storedUser.role : "";
    if (!role || ["driver", "سائق"].includes(role)) {
      clearAuth(); // add this import at top of file
      router.replace("/login");
      return;
    }
    let mounted = true;

    async function load() {
      try {
        const summary = await getDashboardSummary();
        if (mounted) setData(summary);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const stats = data?.data?.stats;
  const alerts = data?.data?.alerts;
  const activeTrips = data?.data?.activeTrips || [];

  const summaryCards = useMemo(
    () => [
      { label: "العملاء", value: stats?.clients ?? 0, tone: "from-cyan-500 to-sky-600" },
      { label: "الطلبات", value: stats?.orders ?? 0, tone: "from-violet-500 to-fuchsia-600" },
      { label: "الرحلات", value: stats?.trips ?? 0, tone: "from-emerald-500 to-green-600" },
      { label: "المركبات", value: (stats?.cars ?? 0) + (stats?.drivers ?? 0), tone: "from-amber-400 to-orange-500" },
    ],
    [stats],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#111827_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">لوحة العمليات</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white lg:text-4xl">ذكاء الأسطول في لمحة سريعة</h1>
              <p className="mt-3 max-w-3xl text-slate-300">هذه الشاشة متوافقة مع نقطة ملخص لوحة الإدارة في الخلفية وتوفر عرضًا واضحًا لطلب الأسطول، وتنبيهات السلامة، وتقدم الرحلات.</p>
            </div>
            <Link href="/" className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20">العودة إلى بوابة العميل</Link>
          </div>
        </header>

        {loading && <p className="text-slate-300">جارٍ تحميل مقاييس الخلفية…</p>}
        {error && <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p>}

        {!loading && !error && (
          <>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((item) => (
                <article key={item.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
                  <div className={`h-2 rounded-full bg-linear-to-r ${item.tone}`} />
                  <p className="mt-4 text-sm uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-4xl font-semibold text-white">{item.value}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">الرحلات النشطة</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">تقدم الرحلات</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">مباشر من /dashboard/summary</span>
                </div>
                <div className="mt-6 space-y-4">
                  {activeTrips.length ? activeTrips.map((trip) => (
                    <div key={trip.id} className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{trip.tripNumber}</p>
                          <p className="text-sm text-slate-300">{trip.title}</p>
                        </div>
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">{trip.progress}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-700">
                        <div className="h-2 rounded-full bg-linear-to-r from-cyan-400 to-emerald-400" style={{ width: `${trip.progress}%` }} />
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-300">لا توجد رحلات في-progress حالياً.</p>}
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.25em] text-amber-200">تنبيهات الالتزام</p>
                <h2 className="mt-2 text-xl font-semibold text-white">التجديدات القادمة</h2>
                <div className="mt-6 space-y-4 text-sm text-slate-200">
                  {(alerts?.expiringCars || []).slice(0, 3).map((item, index) => (
                    <div key={`car-${index}`} className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4">{String((item as Record<string, unknown>).message || "Vehicle expiry alert")}</div>
                  ))}
                  {(alerts?.expiringDrivers || []).slice(0, 3).map((item, index) => (
                    <div key={`driver-${index}`} className="rounded-2xl border border-rose-400/20 bg-rose-500/8 p-4">{String((item as Record<string, unknown>).message || "Driver expiry alert")}</div>
                  ))}
                  {(alerts?.upcomingMaint || []).slice(0, 3).map((item, index) => (
                    <div key={`maint-${index}`} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4">{String((item as Record<string, unknown>).message || "Maintenance alert")}</div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.25em] text-violet-200">الأمان</p>
                <h2 className="mt-2 text-xl font-semibold text-white">لمحة الحساب</h2>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-sm text-slate-200">آخر تسجيل دخول: {data?.data?.accountSecurity?.lastLogin || "لم يتم العثور على حدث تسجيل دخول"}</div>
                  <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-sm text-slate-200">بيانات الجهاز: {data?.data?.accountSecurity?.requestMeta ? JSON.stringify(data.data.accountSecurity.requestMeta) : "غير متاح"}</div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">خريطة الخلفية</p>
                <h2 className="mt-2 text-xl font-semibold text-white">النقاط النهائية المستندة إلى Swagger</h2>
                <ul className="mt-6 grid gap-3 text-sm text-slate-200">
                  <li className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">/v1/dashboard/summary — نظرة عامة تشغيلية</li>
                  <li className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">/v1/client — إدارة العملاء</li>
                  <li className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">/v1/orders — دورة شحن الطلبات</li>
                  <li className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">/v1/trip — تنظيم الرحلات</li>
                </ul>
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
