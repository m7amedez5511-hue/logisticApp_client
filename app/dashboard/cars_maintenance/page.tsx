"use client";

import { useState } from "react";
import { Spinner, Alert } from "@/src/Components/UI";
import { CarMaintenanceDetailPanel } from "@/src/Components/Car_Maintanance";
import { useCars } from "@/src/hooks/useCars";
import { STATUS_MAP, INS_MAP } from "@/src/types/car";
import type { Car } from "@/src/types/car";

// ── Car picker card ───────────────────────────────────────────────────────────
// A simplified version of the car card used on the cars page — just enough
// info to recognise the vehicle, plus a button that opens its maintenance log.

function MaintenanceCarCard({ car, onOpen }: { car: Car; onOpen: () => void }) {
  const status = STATUS_MAP[car.currentStatus];
  const ins = car.insuranceStatus ? INS_MAP[car.insuranceStatus] : null;

  return (
    <article
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
      aria-label={`سجل صيانة ${car.manufacturer} ${car.model} — ${car.plateLetters} ${car.plateNumber}`}
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
        cursor: "pointer",
        transition: "box-shadow 200ms, transform 200ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(37,99,235,.12)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Colour accent bar by status, same as the cars grid */}
      <div style={{ height: 4, background: status.dot, borderRadius: "var(--radius-xl) var(--radius-xl) 0 0" }} />

      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              {car.manufacturer} {car.model}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
              {car.year}{car.color ? ` · ${car.color}` : ""}
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            borderRadius: "var(--radius-full)",
            border: `1px solid ${status.border}`,
            background: status.bg,
            padding: "0.2rem 0.625rem",
            fontSize: 11, fontWeight: 700, color: status.color,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.dot }} />
            {status.label}
          </span>
        </div>

        {/* Plate number */}
        <div style={{
          marginTop: "0.875rem",
          background: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "0.5rem 0.75rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600 }}>رقم اللوحة</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-brand-700)" }}>
            {car.plateLetters} {car.plateNumber}
          </span>
        </div>

        <div style={{ marginTop: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>الفرع</span>
            <span style={{ color: "var(--color-text-primary)", marginTop: 2, display: "block" }}>{car.branch?.name ?? "—"}</span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>التأمين</span>
            <span style={{ color: ins?.color ?? "var(--color-text-muted)", marginTop: 2, display: "block", fontWeight: 600 }}>
              {ins?.label ?? "—"}
            </span>
          </div>
        </div>

        <p style={{ marginTop: "0.875rem", fontSize: 11, color: "var(--color-brand-600)", fontWeight: 600, textAlign: "left" }}>
          عرض سجل الصيانة ←
        </p>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
// Maintenance is scoped per car (the API only exposes /cars/:id/maintenance),
// so this page works as a car picker: choose a car, then manage its
// maintenance records in a slide-over panel.

export default function CarsMaintenancePage() {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  // Which car's maintenance log is currently open, if any.
  const [activeCar, setActiveCar] = useState<Car | null>(null);

  const { cars, loading, error, total, pages, setError } = useCars(page, search);

  const carLabel = activeCar
    ? `${activeCar.manufacturer} ${activeCar.model} — ${activeCar.plateLetters} ${activeCar.plateNumber}`
    : undefined;

  return (
    <>
      {activeCar && (
        <CarMaintenanceDetailPanel
          carId={activeCar.id}
          carLabel={carLabel}
          onClose={() => setActiveCar(null)}
        />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">
        {/* ── Header ── */}
        <header style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "1.5rem 2rem",
          boxShadow: "var(--shadow-card)",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600 }}>
            إدارة الأسطول
          </p>
          <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                صيانة المركبات
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                اختر مركبة لعرض أو تسجيل عمليات الصيانة الخاصة بها — إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> مركبة
              </p>
            </div>

            {/* Search */}
            <div style={{ position: "relative", width: 256 }}>
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="بحث بالماركة أو اللوحة..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                dir="rtl"
                style={{
                  width: "100%", height: 40, paddingRight: 36, paddingLeft: 12,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  fontSize: 13, color: "var(--color-text-primary)",
                  outline: "none", fontFamily: "var(--font-sans)",
                }}
              />
            </div>
          </div>
        </header>

        {/* Error alert */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* ── Loading ── */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "5rem 0", color: "var(--color-text-muted)" }}>
            <Spinner size="md" className="text-blue-600" />
            <span style={{ fontSize: 14 }}>جارٍ تحميل المركبات…</span>
          </div>
        ) : cars.length === 0 ? (
          /* ── Empty state ── */
          <div style={{
            borderRadius: "var(--radius-xl)",
            border: "2px dashed var(--color-border)",
            background: "var(--color-surface)",
            padding: "5rem 2rem",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔧</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {search ? `لا توجد مركبات تطابق "${search}"` : "لا توجد مركبات بعد"}
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6 }}>
              أضف مركبة من صفحة السيارات أولاً حتى تتمكن من تسجيل صيانتها.
            </p>
          </div>
        ) : (
          /* ── Car grid ── */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}>
            {cars.map((car) => (
              <MaintenanceCarCard key={car.id} car={car} onOpen={() => setActiveCar(car)} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "0.875rem 1.5rem",
            boxShadow: "var(--shadow-card)",
          }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              صفحة <strong style={{ color: "var(--color-text-primary)" }}>{page}</strong> من{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>{pages}</strong>
              {" · "}
              <span style={{ color: "var(--color-text-hint)" }}>{total} مركبة</span>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { label: "← السابق", action: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
                { label: "التالي →", action: () => setPage((p) => Math.min(pages, p + 1)), disabled: page === pages },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-muted)",
                    padding: "0.375rem 0.875rem",
                    fontSize: 12, color: "var(--color-text-secondary)",
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    opacity: btn.disabled ? 0.4 : 1,
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
