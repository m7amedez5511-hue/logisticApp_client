"use client";

import { useState } from "react";
import { Alert } from "../../UI";
import { ArchivedCarTable } from "./Archivedcartable";
import { ArchivedCarDetailPanel } from "./Archivedcardetailpanel";
import { useArchivedCars } from "@/src/hooks/archive/Usearchivedcars";
import type { Car } from "@/src/types/car";

interface ArchivedCarsModalProps {
  onClose: () => void;
}

export function ArchivedCarsModal({ onClose }: ArchivedCarsModalProps) {
  const [viewCar, setViewCar] = useState<Car | null>(null);

  const {
    cars, loading, total, pages, error,
    page, search,
    setPage, handleSearch, setError,
  } = useArchivedCars();

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="archive-cars-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "2rem 1rem", overflowY: "auto",
      }}
    >
      {viewCar && (
        <ArchivedCarDetailPanel
          car={viewCar}
          loading={false}
          error={null}
          onClose={() => setViewCar(null)}
        />
      )}

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 980,
          background: "var(--color-surface-sunken)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div dir="rtl" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#EA580C", fontWeight: 600, margin: 0 }}>
              الأرشيف
            </p>
            <h2 id="archive-cars-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              المركبات المؤرشفة
              <span style={{ marginInlineStart: 8, fontSize: 13, fontWeight: 500, color: "var(--color-text-muted)" }}>
                ({total})
              </span>
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* search */}
          <div dir="rtl" style={{ position: "relative", maxWidth: 320 }}>
            <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-hint)", pointerEvents: "none" }}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="بحث بالماركة أو اللوحة..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              dir="rtl"
              style={{
                width: "100%", height: 40,
                paddingRight: 36, paddingLeft: 12,
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, outline: "none",
                fontFamily: "var(--font-sans)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          <ArchivedCarTable
            cars={cars}
            loading={loading}
            search={search}
            page={page}
            pages={pages}
            onView={car => setViewCar(car)}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}