"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "../UI";
import { driverService } from "@/src/services/driver.service";
import { getStoredToken } from "@/src/lib/auth";
import { DriverReportPanel } from "../Driver_Report/driverReport";
import type { Driver } from "@/src/types/driver";
import {
  DRIVER_STATUS_MAP,
  DRIVER_CARD_TYPE_MAP,
  NATIONAL_ID_TYPE_MAP,
} from "@/src/types/driver";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isExpiringSoon(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() - Date.now() <= 90 * 86_400_000;
}

function DetailRow({
  label,
  value,
  mono = false,
  warn = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "0.55rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          color: warn ? "#D97706" : "var(--color-text-primary)",
          fontWeight: warn ? 600 : 400,
          maxWidth: "60%",
          textAlign: "left",
          wordBreak: "break-word",
        }}
      >
        {warn && value !== "—" ? "⚠ " : ""}
        {value}
      </span>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "var(--color-text-hint)",
        fontWeight: 700,
        margin: "1.25rem 0 0.5rem",
      }}
    >
      {title}
    </p>
  );
}

function PhotoCard({ url, label }: { url?: string | null; label: string }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setImgError(false));
  }, [url]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <div
        style={{
          width: "100%",
          aspectRatio: "4/3",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-muted)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-hint)"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
      {url && !imgError && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: "#2563EB",
            textDecoration: "underline",
            textAlign: "center",
          }}
        >
          عرض الصورة ↗
        </a>
      )}
    </div>
  );
}

interface DriverDetailPanelProps {
  driverId: string;
  onClose: () => void;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}

export function DriverDetailPanel({
  driverId,
  onClose,
  onEdit,
  onDelete,
}: DriverDetailPanelProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDriver = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const data = await driverService.getById(driverId, token);
      setDriver(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل بيانات السائق.");
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => { queueMicrotask(loadDriver); }, [loadDriver]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const statusConfig = driver ? DRIVER_STATUS_MAP[driver.status] : null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      <aside
        aria-label="تفاصيل السائق"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(520px, 100vw)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "8px 0 40px rgba(0,0,0,.18)",
          overflowY: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "2px solid var(--color-brand-200)",
                  background: "var(--color-surface-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {driver?.photoUrl ? (
                  <AvatarImg src={driver.photoUrl} name={driver.name} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-brand-600)" }}>
                    {driver?.name?.charAt(0) ?? "?"}
                  </span>
                )}
              </div>

              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>
                  ملف السائق
                </p>
                {driver && (
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", margin: "3px 0 0" }}>
                    {driver.name}
                  </h2>
                )}
                {driver?.userName && (
                  <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                    @{driver.userName}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                cursor: "pointer",
                fontSize: 18,
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2rem 0" }}>
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>جارٍ التحميل…</span>
            </div>
          )}

          {error && (
            <div style={{
              borderRadius: "var(--radius-md)",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              padding: "0.75rem 1rem",
              fontSize: 13,
              color: "#DC2626",
            }}>
              ⚠ {error}
            </div>
          )}

          {driver && !loading && (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
                {statusConfig && (
                  <span style={{
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${statusConfig.border}`,
                    background: statusConfig.bg,
                    padding: "0.3rem 0.875rem",
                    fontSize: 12,
                    fontWeight: 700,
                    color: statusConfig.color,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusConfig.dot }} />
                    {statusConfig.label}
                  </span>
                )}
                {!driver.isActive && (
                  <span style={{
                    borderRadius: "var(--radius-full)",
                    border: "1px solid #FECACA",
                    background: "#FEF2F2",
                    padding: "0.3rem 0.875rem",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#DC2626",
                  }}>
                    محذوف
                  </span>
                )}
              </div>

              <SectionHeading title="البيانات الشخصية" />
              <DetailRow label="الاسم الكامل"     value={driver.name} />
              <DetailRow label="رقم الجوال"        value={driver.phone} mono />
              <DetailRow label="البريد الإلكتروني" value={driver.email ?? "—"} />
              <DetailRow label="العنوان"           value={driver.address ?? "—"} />
              <DetailRow label="الجنسية"           value={driver.nationality ?? "—"} />
              <DetailRow label="الفرع"             value={driver.branch?.name ?? "—"} />

              <SectionHeading title="الهوية والتأمينات" />
              <DetailRow
                label="نوع الهوية"
                value={driver.nationalIdType ? NATIONAL_ID_TYPE_MAP[driver.nationalIdType] : "—"}
              />
              <DetailRow label="رقم الهوية" value={driver.nationalId ?? "—"} mono />
              <DetailRow
                label="انتهاء الهوية"
                value={fmtDate(driver.nationalIdExpiry)}
                warn={isExpiringSoon(driver.nationalIdExpiry)}
              />
              <DetailRow label="رقم GOSI" value={driver.gosiNumber ?? "—"} mono />

              <SectionHeading title="بيانات رخصة القيادة" />
              <DetailRow label="رقم الرخصة" value={driver.licenseNumber ?? "—"} mono />
              <DetailRow label="نوع الرخصة" value={driver.licenseType ?? "—"} />
              <DetailRow
                label="انتهاء الرخصة"
                value={fmtDate(driver.licenseExpiry)}
                warn={isExpiringSoon(driver.licenseExpiry)}
              />

              <SectionHeading title="بطاقة السائق" />
              <DetailRow label="رقم البطاقة" value={driver.driverCardNumber ?? "—"} mono />
              <DetailRow
                label="نوع البطاقة"
                value={driver.driverCardType ? DRIVER_CARD_TYPE_MAP[driver.driverCardType] : "—"}
              />
              <DetailRow
                label="انتهاء البطاقة"
                value={fmtDate(driver.driverCardExpiry)}
                warn={isExpiringSoon(driver.driverCardExpiry)}
              />
              <DetailRow label="نوع السائق" value={driver.driverType ?? "—"} />

              <SectionHeading title="معلومات النظام" />
              <DetailRow label="اسم المستخدم"  value={driver.userName ?? "—"} mono />
              <DetailRow label="تاريخ الإضافة" value={fmtDate(driver.createdAt)} />
              <DetailRow label="آخر تحديث"     value={fmtDate(driver.updatedAt)} />

              <SectionHeading title="الصور والمستندات" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
                <PhotoCard url={driver.photoUrl}           label="صورة السائق" />
                <PhotoCard url={driver.nationalPhotoUrl}   label="صورة الهوية" />
                <PhotoCard url={driver.driverCardPhotoUrl} label="صورة البطاقة" />
              </div>

              {driver.statusHistory && driver.statusHistory.length > 0 && (
                <>
                  <SectionHeading title="سجل الحالات" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {driver.statusHistory.slice(0, 5).map((h) => {
                      const s = DRIVER_STATUS_MAP[h.status] ?? DRIVER_STATUS_MAP.Active;
                      return (
                        <div
                          key={h.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${s.border}`,
                            background: s.bg,
                            padding: "0.5rem 0.875rem",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                            {h.reason && (
                              <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginRight: 8 }}>
                                — {h.reason}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                            {fmtDate(h.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <DriverReportPanel driverId={driver.id} />
            </>
          )}
        </div>

        {driver && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-surface-muted)",
              display: "flex",
              gap: "0.75rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => onDelete(driver)}
              style={{
                height: 40, padding: "0 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                fontSize: 13, fontWeight: 700, color: "#DC2626",
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              حذف
            </button>

            <button
              type="button"
              onClick={() => onEdit(driver)}
              style={{
                height: 40, padding: "0 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-brand-200)",
                background: "var(--color-brand-50, #EFF6FF)",
                fontSize: 13, fontWeight: 700, color: "var(--color-brand-600)",
                cursor: "pointer", fontFamily: "var(--font-sans)",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              تعديل
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, height: 40,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)",
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              إغلاق
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function AvatarImg({ src, name }: { src: string; name: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-brand-600)" }}>
        {name.charAt(0)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={name}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => setError(true)}
    />
  );
}