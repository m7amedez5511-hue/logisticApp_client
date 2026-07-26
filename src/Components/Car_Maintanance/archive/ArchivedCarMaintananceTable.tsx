"use client";

import { Button, EmptyState, IconBtn, Spinner } from "../../UI";
import { fmtDateShort, fmtCost } from "@/src/types/carMaintanance";
import type { CarMaintenance } from "@/src/types/carMaintanance";

const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
  background: "var(--color-surface)", overflow: "hidden", boxShadow: "var(--shadow-card)",
};
const thStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.2em",
  color: "var(--color-text-muted)", background: "var(--color-surface-muted)",
  borderBottom: "1px solid var(--color-border)",
};

interface ArchivedCarMaintenanceTableProps {
  records:      CarMaintenance[];
  loading:      boolean;
  search:       string;
  page:         number;
  pages:        number;
  /** Only relevant for the global (cross-car) archive view. */
  showCar?:     boolean;
  onView:       (record: CarMaintenance) => void;
  onPageChange: (p: number) => void;
}

export function ArchivedCarMaintenanceTable({
  records, loading, search, page, pages, showCar = false, onView, onPageChange,
}: ArchivedCarMaintenanceTableProps) {
  const columns = showCar ? "2fr 1fr 1fr 1fr 1fr 100px" : "2fr 1fr 1fr 1fr 100px";

  return (
    <div style={cardStyle}>
      <div dir="rtl" style={{ display: "grid", gridTemplateColumns: columns, ...thStyle }}>
        <span>سبب الصيانة</span>
        {showCar && <span>المركبة</span>}
        <span>التكلفة</span>
        <span>تاريخ البدء</span>
        <span style={{ textAlign: "center" }}>تاريخ الانتهاء</span>
        <span style={{ textAlign: "center" }}>إجراءات</span>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "4rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon="🔧"
          title={search ? `لا توجد نتائج لـ "${search}"` : "لا توجد سجلات صيانة في الأرشيف."}
        />
      ) : (
        <ul dir="rtl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {records.map((r, i) => (
            <li key={r.id} style={{
              display: "grid", gridTemplateColumns: columns,
              alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
              background: i % 2 !== 0 ? "var(--color-surface-muted)" : "transparent",
              fontSize: 13,
            }}>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{r.reason}</p>
                <p style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)" }}>أضيف {fmtDateShort(r.createdAt)}</p>
              </div>
              {showCar && (
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {r.car ? `${r.car.manufacturer} ${r.car.model}` : "—"}
                </span>
              )}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                {fmtCost(r.cost)}
              </span>
              <span style={{ color: "var(--color-text-secondary)" }}>{fmtDateShort(r.startAt)}</span>
              <span style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>
                {fmtDateShort(r.endAt)}
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                <IconBtn title={`عرض ${r.reason}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={() => onView(r)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.5rem" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            صفحة <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> من <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { label: "السابق", action: () => onPageChange(Math.max(1, page - 1)),     disabled: page === 1     },
              { label: "التالي", action: () => onPageChange(Math.min(pages, page + 1)), disabled: page === pages },
            ].map(btn => (
              <Button key={btn.label} type="button" variant="secondary" size="sm" onClick={btn.action} disabled={btn.disabled}>
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}