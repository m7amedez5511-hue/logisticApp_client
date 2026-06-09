"use client";
import React, { type FC } from "react";
import { useClientOrders }             from "@/hooks/useClientOrders";
import { fmtDate, fmtAmount }          from "@/lib/formatters";
import { statusColor, statusLabel }    from "@/lib/order-status";
import { clearSession, type ClientSession } from "@/lib/session";
import type { OrderStatus }            from "@/types/client";
import { Spinner }                     from "../../Components/UI";

// ─── Order status tracker ─────────────────────
const STATUS_STEPS: OrderStatus[] = ["CREATED", "IN_TRANSIT", "DELIVERED"];
const STEP_LABELS                  = ["تم الإنشاء", "قيد التوصيل", "تم التسليم"];

const StepIcon: FC<{ step: number }> = ({ step }) => {
  if (step === 0) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
    </svg>
  );
  if (step === 1) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
};

const OrderTracker: FC<{ status: OrderStatus }> = ({ status }) => {
  const idx = STATUS_STEPS.indexOf(status === "CANCELLED" ? "CREATED" : status);
  return (
    <div className="flex items-center gap-0 py-2" dir="rtl" role="list" aria-label="تقدم الطلب">
      {STATUS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1" role="listitem">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              status === "CANCELLED"
                ? "bg-[#FEE2E2] text-red-500 border-2 border-red-200"
                : i <= idx ? "bg-[#1A73E8] text-white" : "bg-white border-2 border-[#E5E7EB] text-[#D1D5DB]"
            }`} aria-current={i === idx ? "step" : undefined}>
              <StepIcon step={i} />
            </div>
            <span className={`text-[10px] font-semibold whitespace-nowrap ${
              status === "CANCELLED" ? "text-red-400" : i <= idx ? "text-[#1A73E8]" : "text-[#9CA3AF]"
            }`}>
              {STEP_LABELS[i]}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div aria-hidden="true" className={`flex-1 h-0.5 mb-4 mx-1 ${
              status === "CANCELLED" ? "bg-red-200" : i < idx ? "bg-[#1A73E8]" : "bg-[#E5E7EB]"
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── DashboardStep ───────────────────────────
interface DashboardStepProps {
  session: ClientSession;
}

const DashboardStep: FC<DashboardStepProps> = ({ session }) => {
  const { orders, loading, error } = useClientOrders(session.id);

  const activeOrder = orders.find(o => o.status === "CREATED" || o.status === "IN_TRANSIT");
  const pastOrders  = orders.filter(o => o !== activeOrder);

  const summary = {
    total:     orders.length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    pending:   orders.filter(o => o.status === "CREATED" || o.status === "IN_TRANSIT").length,
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-[#111827] tracking-tight">لوحة الطلبات</h2>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            مرحبًا بعودتك، <strong className="text-[#111827]">{session.name}</strong>
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#D1FAE5] border border-[#A7F3D0] rounded-full px-3 py-1.5" role="status" aria-label="الحساب نشط">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#10B981] motion-safe:animate-pulse" />
          <span className="text-[11px] font-bold text-[#065F46]">نشط</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-14 gap-3" role="status">
          <Spinner />
          <p className="text-[13px] text-[#6B7280]">جارٍ تحميل الطلبات…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-10" role="alert">
          <p className="text-[13px] text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "إجمالي الطلبات", value: summary.total,     color: "text-[#111827]" },
              { label: "مُسلَّمة",       value: summary.delivered, color: "text-[#34A853]" },
              { label: "قيد التنفيذ",   value: summary.pending,   color: "text-[#1A73E8]" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
                <p className="text-[10px] font-bold text-[#9CA3AF] mb-1">{s.label}</p>
                <p className={`text-[26px] font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Active order tracker */}
          {activeOrder ? (
            <div className="bg-gradient-to-bl from-[#0D47A1] to-[#1A73E8] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-bold text-white/60 tracking-wide">الطلب الحالي</p>
                  <p className="text-[14px] font-bold text-white font-mono">{activeOrder.id}</p>
                </div>
                <span className={`text-[11px] font-bold border px-2.5 py-1 rounded-full ${
                  activeOrder.status === "CREATED"
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-[#D1FAE5] border-[#A7F3D0] text-[#065F46]"
                }`}>
                  {statusLabel(activeOrder.status)}
                </span>
              </div>
              <OrderTracker status={activeOrder.status} />
            </div>
          ) : (
            <div className="border border-dashed border-[#E5E7EB] rounded-xl p-5 mb-6 text-center">
              <p className="text-[13px] text-[#9CA3AF]">لا يوجد طلب نشط حاليًا.</p>
            </div>
          )}

          {/* Past orders table */}
          {pastOrders.length > 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#111827]">سجل الطلبات</p>
                <span className="text-[11px] text-[#9CA3AF] font-medium">{pastOrders.length} طلبات</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" dir="rtl">
                  <thead>
                    <tr className="bg-[#F9FAFB]">
                      {["رقم الطلب", "التاريخ", "الوصف", "الحالة", "المبلغ"].map(h => (
                        <th key={h} scope="col" className="px-4 py-2.5 text-right text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pastOrders.map((order, i) => (
                      <tr key={order.id} className={`border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${i % 2 === 0 ? "" : "bg-[#FAFAFA]/30"}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] font-semibold text-[#1A73E8]">{order.id}</span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#6B7280] whitespace-nowrap">{fmtDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-[12px] text-[#374151]">{order.description}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold border px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusColor(order.status)}`}>
                            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] font-semibold text-[#111827] font-mono whitespace-nowrap">
                          {fmtAmount(order.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => { clearSession(); window.location.reload(); }}
        className="mt-4 text-[11px] text-[#9CA3AF] hover:text-red-400 underline transition-colors"
      >
        مسح الجلسة وإعادة البدء
      </button>
    </div>
  );
};

export default DashboardStep;