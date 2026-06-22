"use client";

import { useEffect, useState } from "react";
import { Spinner } from "../UI";
import { CarImageGallery } from "./CarImageGallery";
import { useCarDetail } from "@/src/hooks/useCars";
import { STATUS_MAP, INS_MAP, fmtDate, isExpiringSoon } from "@/src/types/car";
import type { Car, InsuranceStatus } from "@/src/types/car";

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarDetailPanelProps {
  carId: string;
  onClose: () => void;
  onEdit: (car: Car) => void;
  onDelete: (car: Car) => void;
}

// ── Row component ─────────────────────────────────────────────────────────────

function DetailRow({ label, value, mono = false, warn = false }: {
  label: string; value: string; mono?: boolean; warn?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "0.6rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        color: warn ? "#D97706" : "var(--color-text-primary)",
        fontWeight: warn ? 600 : 400,
      }}>
        {warn && value !== "—" ? "⚠ " : ""}{value}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarDetailPanel({ carId, onClose, onEdit, onDelete }: CarDetailPanelProps) {
  const { car, loading, error } = useCarDetail(carId);
  const [gallery, setGallery] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !gallery) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [gallery, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <aside
        aria-label="تفاصيل المركبة"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
          width: "min(480px, 100vw)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex", flexDirection: "column",
          boxShadow: "8px 0 40px rgba(0,0,0,.18)",
          overflowY: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
                تفاصيل المركبة
              </p>
              {car && (
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
                  {car.manufacturer} {car.model} {car.year}
                </h2>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label="إغلاق"
              style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2rem 0" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>جارٍ التحميل…</span>
            </div>
          )}

          {error && (
            <div style={{ borderRadius: "var(--radius-md)", background: "#FEF2F2", border: "1px solid #FECACA", padding: "0.75rem 1rem", fontSize: 13, color: "#DC2626" }}>
              ⚠ {error}
            </div>
          )}

          {car && !loading && (
            <>
              {/* Status badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                {(() => {
                  const s = STATUS_MAP[car.currentStatus];
                  return (
                    <span style={{ borderRadius: "var(--radius-full)", border: `1px solid ${s.border}`, background: s.bg, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: s.color }}>
                      {s.label}
                    </span>
                  );
                })()}
                {car.insuranceStatus && (() => {
                  const ins = INS_MAP[car.insuranceStatus as InsuranceStatus];
                  return (
                    <span style={{ borderRadius: "var(--radius-full)", border: `1px solid ${ins.color}33`, background: `${ins.color}11`, padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: ins.color }}>
                      تأمين: {ins.label}
                    </span>
                  );
                })()}
                {!car.isActive && (
                  <span style={{ borderRadius: "var(--radius-full)", border: "1px solid #FECACA", background: "#FEF2F2", padding: "0.3rem 0.875rem", fontSize: 12, fontWeight: 700, color: "#DC2626" }}>
                    محذوف
                  </span>
                )}
              </div>

              {/* Section: Basic Info */}
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, marginBottom: "0.5rem" }}>
                بيانات أساسية
              </p>
              <DetailRow label="الشركة المصنعة" value={car.manufacturer} />
              <DetailRow label="الموديل" value={car.model} />
              <DetailRow label="سنة الصنع" value={String(car.year)} />
              <DetailRow label="اللون" value={car.color ?? "—"} />
              <DetailRow label="الفرع" value={car.branch?.name ?? "—"} />

              {/* Section: Plate */}
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "1.25rem 0 0.5rem" }}>
                بيانات اللوحة
              </p>
              <DetailRow label="رقم اللوحة"      value={`${car.plateLetters} ${car.plateNumber}`} mono />
              <DetailRow label="نوع اللوحة"       value={car.plateType ?? "—"} />
              <DetailRow label="رقم الاستمارة"    value={car.registrationNumber ?? "—"} mono />
              <DetailRow label="رقم الهيكل (VIN)" value={car.vinNumber ?? "—"} mono />

              {/* Section: Regulatory */}
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "1.25rem 0 0.5rem" }}>
                الترخيص والتأمين
              </p>
              <DetailRow label="انتهاء الاستمارة"     value={fmtDate(car.registrationExpiryDate)} warn={isExpiringSoon(car.registrationExpiryDate)} />
              <DetailRow label="انتهاء التأمين"        value={fmtDate(car.insuranceExpiryDate)}    warn={isExpiringSoon(car.insuranceExpiryDate)} />
              <DetailRow label="انتهاء الفحص الدوري"  value={fmtDate(car.inspectionExpiryDate)}   warn={isExpiringSoon(car.inspectionExpiryDate)} />
              <DetailRow label="رقم بطاقة التشغيل"    value={car.operationCardNumber ?? "—"} mono />
              <DetailRow label="انتهاء بطاقة التشغيل" value={fmtDate(car.operationCardExpiry)} />

              {/* Section: Operational */}
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "1.25rem 0 0.5rem" }}>
                بيانات تشغيلية
              </p>
              <DetailRow label="رقم GPS"            value={car.gpsDeviceId ?? "—"} mono />
              <DetailRow label="الطاقة الاستيعابية" value={car.capacity != null ? String(car.capacity) : "—"} />
              <DetailRow label="الوزن (كجم)"        value={car.weight != null ? String(car.weight) : "—"} />
              <DetailRow label="حالة الحجز"         value={car.currentImpoundStatus ?? "بدون"} />
              <DetailRow label="تاريخ الإضافة"      value={fmtDate(car.createdAt)} />
              <DetailRow label="آخر تحديث"          value={fmtDate(car.updatedAt)} />

              {/* Status History */}
              {car.statusHistory && car.statusHistory.length > 0 && (
                <>
                  <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "1.25rem 0 0.75rem" }}>
                    سجل الحالات
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {car.statusHistory.slice(0, 6).map(h => {
                      const s = STATUS_MAP[h.carStatus] ?? STATUS_MAP.Active;
                      return (
                        <div key={h.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${s.border}`,
                          background: s.bg,
                          padding: "0.5rem 0.875rem",
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                            {fmtDate(h.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {car && (
          <div style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)",
            display: "flex", gap: "0.75rem",
            flexShrink: 0,
          }}>
            <button type="button" onClick={() => setGallery(true)}
              style={{ flex: 1, height: 40, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              الصور
            </button>
            <button type="button" onClick={() => onEdit(car)}
              style={{ flex: 2, height: 40, borderRadius: "var(--radius-md)", border: "none", background: "var(--color-brand-600)", fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-sans)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              تعديل
            </button>
            <button type="button" onClick={() => onDelete(car)}
              style={{ height: 40, padding: "0 1rem", borderRadius: "var(--radius-md)", border: "1px solid #FECACA", background: "#FEF2F2", fontSize: 13, fontWeight: 700, color: "#DC2626", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              حذف
            </button>
          </div>
        )}
      </aside>

      {gallery && car && (
        <CarImageGallery car={car} onClose={() => setGallery(false)} />
      )}
    </>
  );
}