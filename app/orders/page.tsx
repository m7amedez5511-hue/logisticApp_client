"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { get } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";

interface Order {
  id: string;
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  currentStatus: "Created" | "Assigned" | "InTransit" | "Delivered" | "Returned" | "Cancelled";
  totalPrice?: number;
  paymentMethod?: string;
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
  client?: { name: string };
  trip?: { tripNumber: string };
  createdAt: string;
}

interface ApiResponse {
  data: Order[];
  pagination: { total: number; page: number; pages: number };
}

const STATUS_MAP: Record<Order["currentStatus"], { label: string; cls: string }> = {
  Created:   { label: "تم الإنشاء",   cls: "bg-blue-400/10  border-blue-400/20  text-blue-300"    },
  Assigned:  { label: "مُعيَّن",       cls: "bg-violet-400/10 border-violet-400/20 text-violet-300" },
  InTransit: { label: "قيد التوصيل", cls: "bg-amber-400/10  border-amber-400/20  text-amber-200"  },
  Delivered: { label: "تم التسليم",  cls: "bg-emerald-400/10 border-emerald-400/20 text-emerald-200" },
  Returned:  { label: "مُرتجع",       cls: "bg-rose-500/10   border-rose-400/20   text-rose-300"   },
  Cancelled: { label: "ملغي",         cls: "bg-slate-700/50  border-white/10      text-slate-400"  },
};

const PAY_MAP: Record<string, { label: string; cls: string }> = {
  Pending:  { label: "معلَّق",   cls: "text-amber-400" },
  Paid:     { label: "مدفوع",   cls: "text-emerald-400" },
  Failed:   { label: "فشل",     cls: "text-rose-400"   },
  Refunded: { label: "مُسترجع", cls: "text-slate-400"  },
};

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search)       params.set("search", search);
    if (statusFilter) params.set("currentStatus", statusFilter);
    get<ApiResponse>(`v1/orders?${params}`, token)
      .then((res) => { setOrders(res.data); setTotal(res.pagination.total); setPages(res.pagination.pages); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <section className="flex flex-col gap-6">

      {/* Header */}
      <header className="rounded-3xl border border-white/10 bg-white/6 px-8 py-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">إدارة الشحنات</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">الطلبات</h1>
            <p className="mt-1 text-sm text-slate-400">
              إجمالي <span className="font-semibold text-white">{total}</span> طلب
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              dir="rtl"
              className="h-10 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-300 outline-none transition focus:border-cyan-400/40"
            >
              <option value="">كل الحالات</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="رقم الشحنة أو المستلم..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} dir="rtl"
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/80 pr-9 pl-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20" />
            </div>
          </div>
        </div>
      </header>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} className="border-rose-400/30 bg-rose-500/10 text-rose-200" />}

      {/* Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/20 overflow-hidden">
        <div className="grid grid-cols-[1.8fr_1.5fr_1.2fr_1fr_1fr_1fr] border-b border-white/8 bg-slate-800/60 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400" dir="rtl">
          <span>رقم الشحنة</span>
          <span>المستلم</span>
          <span>العميل</span>
          <span>المبلغ</span>
          <span>الحالة</span>
          <span className="text-center">التاريخ</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
            <Spinner size="sm" className="text-cyan-400" /><span className="text-sm">جارٍ التحميل…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">لا توجد نتائج</div>
        ) : (
          <ul dir="rtl">
            {orders.map((o, i) => {
              const status = STATUS_MAP[o.currentStatus];
              const pay    = o.paymentStatus ? PAY_MAP[o.paymentStatus] : null;
              return (
                <li key={o.id} className={`grid grid-cols-[1.8fr_1.5fr_1.2fr_1fr_1fr_1fr] items-center gap-2 border-b border-white/5 px-6 py-4 text-sm transition-colors hover:bg-slate-800/50 ${i % 2 === 0 ? "" : "bg-slate-900/30"}`}>
                  {/* Shipment number */}
                  <div>
                    <p className="font-mono text-xs font-bold text-cyan-300">{o.shipmentNumber}</p>
                    {o.trip && <p className="mt-0.5 text-[11px] text-slate-500">رحلة: {o.trip.tripNumber}</p>}
                  </div>
                  {/* Recipient */}
                  <div>
                    <p className="text-white">{o.recipientName}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{o.recipientPhone}</p>
                  </div>
                  {/* Client */}
                  <span className="text-slate-300">{o.client?.name ?? "—"}</span>
                  {/* Amount */}
                  <div>
                    <p className="font-semibold text-white">
                      {o.totalPrice != null ? `${o.totalPrice.toFixed(2)} ر.س` : "—"}
                    </p>
                    {pay && <p className={`mt-0.5 text-[11px] font-semibold ${pay.cls}`}>{pay.label}</p>}
                  </div>
                  {/* Status */}
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>
                    {status.label}
                  </span>
                  {/* Date */}
                  <span className="text-center text-xs text-slate-400">{fmtDate(o.createdAt)}</span>
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