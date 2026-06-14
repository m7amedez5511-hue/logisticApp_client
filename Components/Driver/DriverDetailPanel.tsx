"use client";
// Components/Driver/DriverDetailPanel.tsx
// Slide-in panel displaying comprehensive driver details,
// profile photo, status history, and daily report generation.

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "../UI";
import { driverService } from "../../services/driver.service";
import { getStoredToken } from "../../lib/auth";
import type { Driver } from "../../types/driver";
import {
  DRIVER_STATUS_MAP,
  DRIVER_CARD_TYPE_MAP,
  NATIONAL_ID_TYPE_MAP,
} from "../../types/driver";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format an ISO date string to a readable Arabic date. */
function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Returns true if the date is within 90 days in the future (or already past). */
function isExpiringSoon(iso?: string | null): boolean {
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= 90 * 86_400_000;
}

/** Build the full image URL via the proxy to avoid CORS issues. */
function buildPhotoUrl(filename?: string | null): string | null {
  if (!filename) return null;
  return `/api/proxy/driver-photos/${filename}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <span
        style={{
          fontSize: 12,
          color: "var(--color-text-muted)",
          fontWeight: 600,
        }}
      >
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

// ── Report generator sub-panel ───────────────────────────────────────────────

function ReportPanel({ driverId }: { driverId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setReportUrl(null);
    try {
      const token = getStoredToken();
      const res = await driverService.getDailyReport(driverId, date, token);
      const url = (
        res as unknown as { data: { reportUrl: string } }
      ).data?.reportUrl;
      setReportUrl(url ?? null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "تعذّر إنشاء التقرير.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "1.5rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-muted)",
        padding: "1rem",
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#2563EB",
          fontWeight: 700,
          margin: "0 0 0.75rem",
        }}
      >
        إنشاء تقرير يومي
      </p>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        {/* Date input */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <label
            htmlFor="report-date"
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: 4,
            }}
          >
            تاريخ التقرير
          </label>
          <input
            id="report-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              setDate(e.target.value);
              setReportUrl(null);
              setError(null);
            }}
            style={{
              width: "100%",
              height: 38,
              padding: "0 0.625rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13,
              color: "var(--color-text-primary)",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !date}
          style={{
            alignSelf: "flex-end",
            height: 38,
            padding: "0 1rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            background:
              loading || !date
                ? "var(--color-brand-400)"
                : "var(--color-brand-600)",
            fontSize: 13,
            fontWeight: 700,
            color: "#FFF",
            cursor: loading || !date ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
          }}
        >
          {loading && <Spinner size="sm" className="text-white" />}
          {loading ? "جارٍ الإنشاء…" : "إنشاء التقرير"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: "0.75rem",
            borderRadius: "var(--radius-md)",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            padding: "0.625rem 0.875rem",
            fontSize: 12,
            color: "#DC2626",
            fontWeight: 500,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Success link */}
      {reportUrl && (
        <div
          style={{
            marginTop: "0.75rem",
            borderRadius: "var(--radius-md)",
            background: "#DCFCE7",
            border: "1px solid #BBF7D0",
            padding: "0.625rem 0.875rem",
            fontSize: 12,
            color: "#166534",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>✓ تم إنشاء التقرير بنجاح</span>
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#166534",
              textDecoration: "underline",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            فتح التقرير ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DriverDetailPanelProps {
  driverId: string;
  onClose: () => void;
  onDelete: (driver: Driver) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DriverDetailPanel({
  driverId,
  onClose,
  onDelete,
}: DriverDetailPanelProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Fetch driver data
  const loadDriver = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await driverService.getById(driverId, token);
      setDriver((res as unknown as { data: Driver }).data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "تعذّر تحميل بيانات السائق.",
      );
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadDriver();
  }, [loadDriver]);

  // Close on Escape key
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const photoUrl = driver ? buildPhotoUrl(driver.photo) : null;
  const statusConfig = driver ? DRIVER_STATUS_MAP[driver.status] : null;

  return (
    <>
      {/* Backdrop */}
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

      {/* Slide-in panel — from the left, mirroring CarDetailPanel */}
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
        {/* ── Header ── */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-muted)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            {/* Photo + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar */}
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
                {photoUrl && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={driver?.name ?? "صورة السائق"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  /* Fallback: initials avatar */
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--color-brand-600)",
                    }}
                  >
                    {driver?.name?.charAt(0) ?? "?"}
                  </span>
                )}
              </div>

              <div>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#2563EB",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  ملف السائق
                </p>
                {driver && (
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      margin: "3px 0 0",
                    }}
                  >
                    {driver.name}
                  </h2>
                )}
                {driver?.userName && (
                  <p
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                      margin: "2px 0 0",
                    }}
                  >
                    @{driver.userName}
                  </p>
                )}
              </div>
            </div>

            {/* Close button */}
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

        {/* ── Scrollable content ── */}
        <div
          style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}
        >
          {/* Loading */}
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "2rem 0",
              }}
            >
              <Spinner size="sm" className="text-blue-600" />
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                جارٍ التحميل…
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                borderRadius: "var(--radius-md)",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                padding: "0.75rem 1rem",
                fontSize: 13,
                color: "#DC2626",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {driver && !loading && (
            <>
              {/* Status badges */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}
              >
                {statusConfig && (
                  <span
                    style={{
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
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: statusConfig.dot,
                      }}
                    />
                    {statusConfig.label}
                  </span>
                )}
                {!driver.isActive && (
                  <span
                    style={{
                      borderRadius: "var(--radius-full)",
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      padding: "0.3rem 0.875rem",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#DC2626",
                    }}
                  >
                    محذوف
                  </span>
                )}
              </div>

              {/* ── Section: Personal Info ── */}
              <SectionHeading title="البيانات الشخصية" />
              <DetailRow label="الاسم الكامل"  value={driver.name} />
              <DetailRow label="رقم الجوال"    value={driver.phone} mono />
              <DetailRow label="البريد الإلكتروني" value={driver.email ?? "—"} />
              <DetailRow label="العنوان"        value={driver.address ?? "—"} />
              <DetailRow label="الجنسية"        value={driver.nationality ?? "—"} />
              <DetailRow label="الفرع"          value={driver.branch?.name ?? "—"} />

              {/* ── Section: ID & GOSI ── */}
              <SectionHeading title="الهوية والتأمينات" />
              <DetailRow
                label="نوع الهوية"
                value={
                  driver.nationalIdType
                    ? NATIONAL_ID_TYPE_MAP[driver.nationalIdType]
                    : "—"
                }
              />
              <DetailRow label="رقم الهوية"      value={driver.nationalId ?? "—"} mono />
              <DetailRow
                label="انتهاء الهوية"
                value={fmtDate(driver.nationalIdExpiry)}
                warn={isExpiringSoon(driver.nationalIdExpiry)}
              />
              <DetailRow label="رقم GOSI"         value={driver.gosiNumber ?? "—"} mono />

              {/* ── Section: License ── */}
              <SectionHeading title="بيانات رخصة القيادة" />
              <DetailRow label="رقم الرخصة"   value={driver.licenseNumber ?? "—"} mono />
              <DetailRow label="نوع الرخصة"   value={driver.licenseType ?? "—"} />
              <DetailRow
                label="انتهاء الرخصة"
                value={fmtDate(driver.licenseExpiry)}
                warn={isExpiringSoon(driver.licenseExpiry)}
              />

              {/* ── Section: Driver Card ── */}
              <SectionHeading title="بطاقة السائق" />
              <DetailRow
                label="رقم البطاقة"
                value={driver.driverCardNumber ?? "—"}
                mono
              />
              <DetailRow
                label="نوع البطاقة"
                value={
                  driver.driverCardType
                    ? DRIVER_CARD_TYPE_MAP[driver.driverCardType]
                    : "—"
                }
              />
              <DetailRow
                label="انتهاء البطاقة"
                value={fmtDate(driver.driverCardExpiry)}
                warn={isExpiringSoon(driver.driverCardExpiry)}
              />
              <DetailRow
                label="نوع السائق"
                value={driver.driverType ?? "—"}
              />

              {/* ── Section: System Info ── */}
              <SectionHeading title="معلومات النظام" />
              <DetailRow label="اسم المستخدم"    value={driver.userName ?? "—"} mono />
              <DetailRow label="تاريخ الإضافة"   value={fmtDate(driver.createdAt)} />
              <DetailRow label="آخر تحديث"        value={fmtDate(driver.updatedAt)} />

              {/* ── Status History ── */}
              {driver.statusHistory && driver.statusHistory.length > 0 && (
                <>
                  <SectionHeading title="سجل الحالات" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {driver.statusHistory.slice(0, 5).map((h) => {
                      const s =
                        DRIVER_STATUS_MAP[h.status] ?? DRIVER_STATUS_MAP.Active;
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
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: s.color,
                              }}
                            >
                              {s.label}
                            </span>
                            {h.reason && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--color-text-muted)",
                                  marginRight: 8,
                                }}
                              >
                                — {h.reason}
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {fmtDate(h.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Report Panel ── */}
              <ReportPanel driverId={driver.id} />
            </>
          )}
        </div>

        {/* ── Footer actions ── */}
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
            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(driver)}
              style={{
                height: 40,
                padding: "0 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                fontSize: 13,
                fontWeight: 700,
                color: "#DC2626",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              حذف
            </button>
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: 40,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
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