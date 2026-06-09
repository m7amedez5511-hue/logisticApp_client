"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { get } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";

interface Driver {
  id: string;
  name: string;
  userName?: string;
  phone: string;
  nationality?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  nationalIdExpiry?: string;
  status: "Active" | "Inactive" | "InTrip" | "Suspended";
  isActive: boolean;
  branch?: { name: string };
  createdAt: string;
}

interface ApiResponse {
  data: Driver[];
  pagination: { total: number; page: number; pages: number };
}

const STATUS_MAP: Record<Driver["status"], { label: string; cls: string }> = {
  Active:    { label: "نشط",      cls: "bg-emerald-400/10 border-emerald-400/20 text-emerald-200" },
  InTrip:    { label: "في رحلة", cls: "bg-cyan-400/10   border-cyan-400/30   text-cyan-200"    },
  Inactive:  { label: "غير نشط", cls: "bg-slate-700/50  border-white/10      text-slate-400"   },
  Suspended: { label: "موقوف",   cls: "bg-rose-500/10   border-rose-400/20   text-rose-300"    },
};

function expirySoon(iso?: string) {
  if (!iso) return false;
  const days = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days <= 90;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);

  useEffect(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    const query = `?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    get<ApiResponse>(`v1/driver${query}`, token)
      .then((res) => { setDrivers(res.data); setTotal(res.pagination.total); setPages(res.pagination.pages); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  function fmtDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <section className="flex flex-col gap-6">

      {/* Header */}
      <header className="rounded-3xl border border-white/10 bg-white/6 px-8 py-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">إدارة الكوادر</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">السائقون</h1>
            <p className="mt-1 text-sm text-slate-400">
              إجمالي <span className="font-semibold text-white">{total}</span> سائق مسجل
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} dir="rtl"
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/80 pr-9 pl-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20" />
          </div>
        </div>
      </header>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} className="border-rose-400/30 bg-rose-500/10 text-rose-200" />}

      {/* Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20 overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr] border-b border-white/8 bg-slate-800/60 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400" dir="rtl">
          <span>السائق</span>
          <span>الفرع</span>
          <span>الجنسية</span>
          <span>انتهاء الرخصة</span>
          <span>الحالة</span>
          <span className="text-center">انتهاء الهوية</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
            <Spinner size="sm" className="text-cyan-400" /><span className="text-sm">جارٍ التحميل…</span>
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">لا توجد نتائج {search && `لـ "${search}"`}</div>
        ) : (
          <ul dir="rtl">
            {drivers.map((d, i) => {
              const status   = STATUS_MAP[d.status];
              const licWarn  = expirySoon(d.licenseExpiry);
              const idWarn   = expirySoon(d.nationalIdExpiry);
              return (
                <li key={d.id} className={`grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr] items-center gap-2 border-b border-white/5 px-6 py-4 text-sm transition-colors hover:bg-slate-800/50 ${i % 2 === 0 ? "" : "bg-slate-900/30"}`}>
                  {/* Name */}
                  <div>
                    <p className="font-semibold text-white">{d.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{d.phone}</p>
                  </div>
                  {/* Branch */}
                  <span className="text-slate-300">{d.branch?.name ?? "—"}</span>
                  {/* Nationality */}
                  <span className="text-slate-300">{d.nationality ?? "—"}</span>
                  {/* License expiry */}
                  <span className={`text-xs font-semibold ${licWarn ? "text-amber-400" : "text-slate-400"}`}>
                    {licWarn && "⚠ "}{fmtDate(d.licenseExpiry)}
                  </span>
                  {/* Status */}
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>
                    {status.label}
                  </span>
                  {/* ID expiry */}
                  <span className={`text-center text-xs font-semibold ${idWarn ? "text-amber-400" : "text-slate-400"}`}>
                    {idWarn && "⚠ "}{fmtDate(d.nationalIdExpiry)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-white/8 px-6 py-4" dir="rtl">
            <span className="text-xs text-slate-400">صفحة <span className="text-white">{page}</span> من <span className="text-white">{pages}</span></span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">السابق</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">التالي</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}