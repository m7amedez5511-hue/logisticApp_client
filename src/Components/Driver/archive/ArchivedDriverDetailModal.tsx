"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Spinner, Toast } from "../../UI";
import { PhotoCard } from "../DriverPhotos";
import { getStoredToken } from "@/src/lib/auth";
import { archivedDriverService } from "@/src/services/archive/archivedDriver.service";
import {
  DRIVER_STATUS_MAP,
  DRIVER_CARD_TYPE_MAP,
  NATIONAL_ID_TYPE_MAP,
} from "@/src/types/driver";
import type { ArchivedDriver, DriverStatusHistoryEntry } from "@/src/types/driver";
import type { ToastNotification } from "@/src/Components/UI";

interface ArchivedDriverDetailModalProps {
  driverId: string;
  onClose:  () => void;
}

// ── small helper components ───────────────────────────────────────────────────
// (No shared-UI equivalents — purpose-built layouts, not generic controls.)

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
 * documents/photos and status history. Fetches `getById` on mount — the
 * archived detail response includes status history embedded.
 */
export function ArchivedDriverDetailModal({ driverId, onClose }: ArchivedDriverDetailModalProps) {
  const [driver,  setDriver]  = useState<ArchivedDriver | null>(null);
  const [history, setHistory] = useState<DriverStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<ToastNotification | null>(null);

  // fetch archived driver details on mount — status history comes embedded
  // in the same response, no separate call needed
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const driverData = await archivedDriverService.getByIdUnwrapped(driverId, token);
        if (!cancelled) {
          setDriver(driverData);
          setHistory(driverData.statusHistory ?? []);
        }
      } catch {
        if (!cancelled) setNotification({ type: "error", message: "تعذّر تحميل بيانات السائق المؤرشف. يرجى المحاولة لاحقاً." });
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
    <Modal
      open
      title={driver?.name ?? "عرض السائق"}
      subtitle="سائق مؤرشف"
      onClose={onClose}
      zIndex={60}
      size="lg"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {/* loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem 0", color: "var(--color-text-muted)" }}>
          <Spinner size="sm" className="text-blue-600" />
          <span style={{ fontSize: 13 }}>جارٍ التحميل…</span>
        </div>
      )}

      {/* error */}
      {!loading && <Toast notification={notification} onDismiss={() => setNotification(null)} />}

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
    </Modal>
  );
}