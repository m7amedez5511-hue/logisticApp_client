"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "../../lib/auth";
import { carService } from "../../services/car.service";
import { get } from "../../services/api";
import { Spinner, Alert } from "../../Components/UI";
import { CarFormModal }   from "../../Components/car/CarFormModal";
import { CarDetailPanel } from "../../Components/car/CarDetailPanel";
import { CarDeleteModal } from "../../Components/car/CarDeleteModal";
import type { Car, CreateCarPayload, UpdateCarPayload } from "../../types/car";

// ── API response shape ────────────────────────────────────────────────────────
interface ApiResponse {
  data: {
    data: Car[];
    pagination: { total: number; page: number; pages: number };
    meta?: { total: number; pages: number };
  };
}

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_MAP: Record<
  Car["currentStatus"],
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  Active:        { label: "نشط",      color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", dot: "#16A34A" },
  InMaintenance: { label: "صيانة",    color: "#854D0E", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  InTrip:        { label: "في رحلة",  color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  Inactive:      { label: "غير نشط", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0", dot: "#94A3B8" },
};

const INS_MAP: Record<string, { label: string; color: string }> = {
  Valid:       { label: "سارٍ",        color: "#16A34A" },
  Expired:     { label: "منتهي",       color: "#DC2626" },
  NotInsured:  { label: "غير مؤمَّن", color: "#D97706" },
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function isExpiringSoon(iso?: string) {
  if (!iso) return false;
  return (new Date(iso).getTime() - Date.now()) / 86_400_000 <= 90;
}

// ── Toast (inline — mirrors Components/User/Toast pattern) ───────────────────
interface ToastMsg { type: "success" | "error"; message: string }

function CarToast({ notification }: { notification: ToastMsg | null }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (notification) setVis(true);
    else { const t = setTimeout(() => setVis(false), 300); return () => clearTimeout(t); }
  }, [notification]);
  if (!vis && !notification) return null;
  const ok = notification?.type === "success";
  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: `translateX(-50%) translateY(${notification ? "0" : "16px"})`,
      zIndex: 9999, transition: "transform 250ms ease, opacity 250ms ease",
      opacity: notification ? 1 : 0, pointerEvents: "none",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0.75rem 1.25rem",
        borderRadius: "var(--radius-full)",
        background: ok ? "#065F46" : "#7F1D1D",
        color: "#FFF", fontSize: 13, fontWeight: 600,
        boxShadow: "0 8px 32px rgba(0,0,0,.25)",
        maxWidth: "90vw", whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)",
      }}>
        <span style={{ fontSize: 16 }}>{ok ? "✓" : "⚠"}</span>
        <span>{notification?.message}</span>
      </div>
    </div>
  );
}

// ── Vehicle Card component ────────────────────────────────────────────────────
function CarCard({ car, onClick }: { car: Car; onClick: () => void }) {
  const status = STATUS_MAP[car.currentStatus];
  const ins    = car.insuranceStatus ? INS_MAP[car.insuranceStatus] : null;
  const regWarn = isExpiringSoon(car.registrationExpiryDate as string | undefined);

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      aria-label={`${car.manufacturer} ${car.model} — ${car.plateLetters} ${car.plateNumber}`}
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
        cursor: "pointer",
        transition: "box-shadow 200ms, transform 200ms",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(37,99,235,.12)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Colour accent bar by status */}
      <div style={{
        height: 4,
        background: status.dot,
        borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
      }} />

      <div style={{ padding: "1.25rem" }}>
        {/* Manufacturer + model */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              {car.manufacturer} {car.model}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
              {car.year}{car.color ? ` · ${car.color}` : ""}
            </p>
          </div>
          {/* Status badge */}
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

        {/* Plate number — prominent */}
        <div style={{
          marginTop: "0.875rem",
          background: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "0.5rem 0.75rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600 }}>رقم اللوحة</span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--color-brand-700)",
          }}>
            {car.plateLetters} {car.plateNumber}
          </span>
        </div>

        {/* Key attributes grid */}
        <div style={{ marginTop: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {/* Branch */}
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>الفرع</span>
            <span style={{ color: "var(--color-text-primary)", marginTop: 2, display: "block" }}>
              {car.branch?.name ?? "—"}
            </span>
          </div>
          {/* Insurance */}
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>التأمين</span>
            <span style={{
              color: ins?.color ?? "var(--color-text-muted)",
              marginTop: 2, display: "block", fontWeight: 600,
            }}>
              {ins?.label ?? "—"}
            </span>
          </div>
          {/* Registration expiry */}
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>انتهاء الاستمارة</span>
            <span style={{
              color: regWarn ? "#D97706" : "var(--color-text-secondary)",
              marginTop: 2, display: "block", fontWeight: regWarn ? 600 : 400,
            }}>
              {regWarn && "⚠ "}{fmtDate(car.registrationExpiryDate as string | undefined)}
            </span>
          </div>
          {/* Capacity */}
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600, display: "block" }}>الطاقة</span>
            <span style={{ color: "var(--color-text-secondary)", marginTop: 2, display: "block" }}>
              {car.capacity != null ? car.capacity : "—"}
            </span>
          </div>
        </div>

        {/* Footer CTA hint */}
        <p style={{
          marginTop: "0.875rem",
          fontSize: 11, color: "var(--color-brand-600)",
          fontWeight: 600, textAlign: "left",
        }}>
          اضغط لعرض التفاصيل ←
        </p>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CarsPage() {
  // List state
  const [cars,    setCars]    = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);

  // Modal state
  const [detailId,     setDetailId]     = useState<string | null>(null);   // CarDetailPanel
  const [formTarget,   setFormTarget]   = useState<Car | null | false>(false); // false=closed
  const [deleteTarget, setDeleteTarget] = useState<Car | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const notify = useCallback((t: typeof toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Fetch list ─────────────────────────────────────────────────────────────
  const loadCars = useCallback(() => {
    const token = getStoredToken();
    setLoading(true);
    setError(null);
    const query = `?page=${page}&limit=12${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    get<ApiResponse>(`cars${query}`, token)
      .then((res) => {
        const payload = (res as unknown as { data: ApiResponse["data"] }).data ?? res;
        setCars((payload as ApiResponse["data"]).data ?? []);
        setTotal((payload as ApiResponse["data"]).meta?.total ?? 0);
        setPages((payload as ApiResponse["data"]).meta?.pages ?? 1);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { loadCars(); }, [loadCars]);

  // ── Create / Update ────────────────────────────────────────────────────────
  const handleFormSubmit = async (
    payload: CreateCarPayload | UpdateCarPayload,
    isNew: boolean,
  ): Promise<boolean> => {
    const token = getStoredToken();
    try {
      if (isNew) {
        await carService.create(payload as CreateCarPayload, token);
        notify({ type: "success", message: "تم إضافة المركبة بنجاح." });
      } else {
        await carService.update((formTarget as Car).id, payload as UpdateCarPayload, token);
        notify({ type: "success", message: "تم تحديث بيانات المركبة." });
      }
      loadCars();
      return true;
    } catch (err: unknown) {
      notify({ type: "error", message: err instanceof Error ? err.message : "فشلت العملية." });
      return false;
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const token = getStoredToken();
    try {
      await carService.delete(deleteTarget.id, token);
      // Optimistic removal — no page refresh needed
      setCars(prev => prev.filter(c => c.id !== deleteTarget.id));
      setTotal(prev => Math.max(0, prev - 1));
      setDeleteTarget(null);
      notify({ type: "success", message: `تم حذف ${deleteTarget.manufacturer} ${deleteTarget.model} بنجاح.` });
    } catch (err: unknown) {
      notify({ type: "error", message: err instanceof Error ? err.message : "فشل الحذف." });
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast notification */}
      <CarToast notification={toast} />

      {/* Detail panel (slide-in) */}
      {detailId && (
        <CarDetailPanel
          carId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(car) => { setDetailId(null); setFormTarget(car); }}
          onDelete={(car) => { setDetailId(null); setDeleteTarget(car); }}
        />
      )}

      {/* Create / Edit modal */}
      {formTarget !== false && (
        <CarFormModal
          editCar={formTarget}
          branches={[]}       // loaded inside modal via its own effect in production
          onClose={() => setFormTarget(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <CarDeleteModal
          car={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
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
                المركبات
              </h1>
              <p style={{ marginTop: "0.25rem", fontSize: 13, color: "var(--color-text-muted)" }}>
                إجمالي <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> مركبة في الأسطول
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
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

              {/* Add button */}
              <button
                type="button"
                onClick={() => setFormTarget(null)}
                style={{
                  height: 40, padding: "0 1.125rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--color-brand-600)",
                  fontSize: 13, fontWeight: 700, color: "#FFF",
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontFamily: "var(--font-sans)",
                  boxShadow: "0 1px 4px rgba(37,99,235,.35)",
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة مركبة
              </button>
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
          /* Empty state */
          <div style={{
            borderRadius: "var(--radius-xl)",
            border: "2px dashed var(--color-border)",
            background: "var(--color-surface)",
            padding: "5rem 2rem",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🚗</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {search ? `لا توجد مركبات تطابق "${search}"` : "لا توجد مركبات بعد"}
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6 }}>
              اضغط على "إضافة مركبة" لإضافة أول مركبة في الأسطول.
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setFormTarget(null)}
                style={{
                  marginTop: 16, height: 40, padding: "0 1.5rem",
                  borderRadius: "var(--radius-lg)",
                  border: "none", background: "var(--color-brand-600)",
                  fontSize: 13, fontWeight: 700, color: "#FFF",
                  cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                إضافة مركبة
              </button>
            )}
          </div>
        ) : (
          /* ── Card grid ── */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}>
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onClick={() => setDetailId(car.id)}
              />
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
                { label: "← السابق", action: () => setPage(p => Math.max(1, p - 1)),    disabled: page === 1     },
                { label: "التالي →", action: () => setPage(p => Math.min(pages, p + 1)), disabled: page === pages },
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