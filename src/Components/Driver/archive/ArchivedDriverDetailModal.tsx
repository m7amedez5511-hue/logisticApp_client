"use client";

import { useEffect, useState } from "react";
import { Spinner } from "../../UI";
import { PhotoCard } from "../DriverPhotos";
import { getStoredToken } from "@/src/lib/auth";
import { archivedDriverService } from "@/src/services/archive/archivedDriver.service";
import {
  DRIVER_STATUS_MAP,
  DRIVER_CARD_TYPE_MAP,
  NATIONAL_ID_TYPE_MAP,
} from "@/src/types/driver";
import type { ArchivedDriver, DriverStatusHistoryEntry } from "@/src/types/driver";

interface ArchivedDriverDetailModalProps {
  driverId: string;
  onClose:  () => void;
}

// ── small helper components ───────────────────────────────────────────────────

/** Renders a single label/value row inside the detail body. */
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "0.75rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: value ? "var(--color-text-primary)" : "var(--color-text-hint)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #EA580C 0%, #B91C1C 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 700, color: "#FFF",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(234,88,12,.3)",
    }}>
      {initials}
    </div>
  );
}

/**
 * Modal showing the full profile of a single archived driver, including
 * documents/photos and status history. Fetches `getById` and
 * `getStatusHistory` in parallel on mount.
 */
export function ArchivedDriverDetailModal({ driverId, onClose }: ArchivedDriverDetailModalProps) {
  const [driver,  setDriver]  = useState<ArchivedDriver | null>(null);
  const [history, setHistory] = useState<DriverStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // fetch archived driver details + status history on mount
 useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const token = getStoredToken();
      const [driverData, historyList] = await Promise.all([
        archivedDriverService.getByIdUnwrapped(driverId, token),
        archivedDriverService.getStatusHistoryUnwrapped(driverId, token),
      ]);
      if (!cancelled) {
        setDriver(driverData);
        setHistory(historyList ?? []);
      }
    } catch {
      if (!cancelled) setError("تعذّر تحميل بيانات السائق المؤرشف. يرجى المحاولة لاحقاً.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [driverId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  const statusConfig = driver ? DRIVER_STATUS_MAP[driver.status] : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="archived-driver-detail-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 55,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--color-surface)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* ── header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
        }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#EA580C", fontWeight: 600, margin: 0 }}>
              سائق مؤرشف
            </p>
            <h2 id="archived-driver-detail-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>
              {driver?.name ?? "عرض السائق"}
            </h2>
          </div>
          <button
            type="button" onClick={onClose} aria-label="إغلاق"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              cursor: "pointer", fontSize: 18,
              color: "var(--color-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* ── body ── */}
        <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "75vh" }}>

          {/* loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
            </div>
          )}

          {/* error */}
          {!loading && error && (
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              background: "#FEF2F2", border: "1px solid #FECACA",
              fontSize: 13, color: "#991B1B", fontWeight: 500,
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* content */}
          {!loading && driver && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }} dir="rtl">

              {/* avatar + name + status row */}
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "0 0 1.25rem",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "0.25rem",
              }}>
                <Avatar name={driver.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{driver.name}</p>
                  {driver.userName && (
                    <p style={{ marginTop: 3, fontFamily: "var(--font-mono)", fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                      @{driver.userName}
                    </p>
                  )}
                  {statusConfig && (
                    <span style={{
                      marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
                      borderRadius: "var(--radius-full)",
                      border: `1px solid ${statusConfig.border}`,
                      background: statusConfig.bg,
                      padding: "0.25rem 0.75rem",
                      fontSize: 12, fontWeight: 600, color: statusConfig.color,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusConfig.dot }} />
                      {statusConfig.label}
                    </span>
                  )}
                </div>
              </div>

              {/* core info */}
              <DetailRow label="رقم الجوال"        value={driver.phone} />
              <DetailRow label="البريد الإلكتروني"  value={driver.email} />
              <DetailRow label="العنوان"           value={driver.address} />
              <DetailRow label="الجنسية"           value={driver.nationality} />
              <DetailRow label="نوع الهوية" value={driver.nationalIdType ? NATIONAL_ID_TYPE_MAP[driver.nationalIdType] : null} />
              <DetailRow label="رقم الهوية" value={driver.nationalId} />
              <DetailRow label="رقم GOSI" value={driver.gosiNumber} />
              <DetailRow label="رقم الرخصة" value={driver.licenseNumber} />
              <DetailRow label="نوع الرخصة" value={driver.licenseType} />
              <DetailRow label="انتهاء الرخصة" value={fmt(driver.licenseExpiry)} />
              <DetailRow label="رقم بطاقة السائق" value={driver.driverCardNumber} />
              <DetailRow label="نوع بطاقة السائق" value={driver.driverCardType ? DRIVER_CARD_TYPE_MAP[driver.driverCardType] : null} />
              <DetailRow label="نوع السائق" value={driver.driverType} />
              <DetailRow label="تاريخ الإنشاء"      value={fmt(driver.createdAt)} />
              <DetailRow label="آخر تحديث"          value={fmt(driver.updatedAt)} />

              {/* photos */}
              <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "1.25rem 0 0.5rem" }}>
                الصور والمستندات
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <PhotoCard url={driver.photoUrl}           label="صورة السائق" />
                <PhotoCard url={driver.nationalPhotoUrl}   label="صورة الهوية" />
                <PhotoCard url={driver.driverCardPhotoUrl} label="صورة البطاقة" />
              </div>

              {/* status history */}
              {history.length > 0 && (
                <>
                  <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: "1.25rem 0 0.5rem" }}>
                    سجل الحالات
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {history.map((h) => {
                      const s = DRIVER_STATUS_MAP[h.status] ?? DRIVER_STATUS_MAP.Active;
                      return (
                        <div key={h.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          borderRadius: "var(--radius-md)", border: `1px solid ${s.border}`,
                          background: s.bg, padding: "0.5rem 0.875rem",
                        }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                            {h.reason && (
                              <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginRight: 8 }}>
                                — {h.reason}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{fmt(h.createdAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            type="button" onClick={onClose}
            style={{
              height: 40, padding: "0 1.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13, fontWeight: 600,
              color: "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}