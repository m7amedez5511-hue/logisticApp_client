"use client";

import { Button, Modal } from "../../UI";
import { ORDER_STATUS_MAP } from "../OrderDetailModel";
import type { ArchivedOrder } from "@/src/types/order";

interface ArchivedOrderDetailModalProps {
  order: ArchivedOrder;
  onClose: () => void;
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0.55rem 0", borderBottom: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}


function fmtAmount(n?: string | number | null): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} ر.س`;
}

export function ArchivedOrderDetailModal({ order, onClose }: ArchivedOrderDetailModalProps) {
  const s = ORDER_STATUS_MAP[order.currentStatus] ?? ORDER_STATUS_MAP.Created;

  return (
    <Modal
      open
      title={order.shipmentNumber}
      subtitle="طلب مؤرشف"
      onClose={onClose}
      zIndex={60}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      <div dir="rtl">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
          {s.label}
        </span>

        <DetailRow label="اسم المستلم" value={order.recipientName} />
        <DetailRow label="رقم الجوال" value={order.recipientPhone} mono />
        <DetailRow label="الكمية" value={String(order.quantity)} />
        <DetailRow label="الإجمالي الفرعي" value={fmtAmount(order.subTotal)} mono />
        <DetailRow label="تاريخ الإنشاء" value={fmtDate(order.createdAt)} />
        <DetailRow label="آخر تحديث" value={fmtDate(order.updatedAt)} />

        {order.statusHistory && order.statusHistory.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "0 0 4px" }}>سجل الحالات</p>
            {order.statusHistory.map(h => {
              const hs = ORDER_STATUS_MAP[h.status] ?? ORDER_STATUS_MAP.Created;
              return (
                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "var(--radius-md)", border: `1px solid ${hs.border}`, background: hs.bg, padding: "0.5rem 0.875rem" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: hs.color }}>{hs.label}{h.reason ? ` — ${h.reason}` : ""}</span>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{fmtDate(h.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}