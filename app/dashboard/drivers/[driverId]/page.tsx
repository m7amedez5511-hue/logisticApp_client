"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/src/Components/UI";
import { DriverFormModal } from "@/src/Components/Driver/DriverFormModal";
import { DriverDeleteModal } from "@/src/Components/Driver/DriverDeleteModal";
import { DriverReportPanel } from "@/src/Components/Driver_Report/driverReport";
import { driverService } from "@/services";
import { getStoredToken } from "@/lib/auth";
import type { Driver, CreateDriverPayload, UpdateDriverPayload } from "@/src/types/driver";
import { DRIVER_STATUS_MAP, DRIVER_CARD_TYPE_MAP, NATIONAL_ID_TYPE_MAP } from "@/src/types/driver";
import { PhotoCard } from "@/src/Components/Driver/DriverPhotos";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function isExpiringSoon(iso?: string | null): boolean {
  if (!iso) return false;
  return (new Date(iso).getTime() - Date.now()) <= 90 * 86_400_000;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: "var(--radius-xl)",
      border: "1px solid var(--color-border)",
      background: "var(--color-surface)",
      overflow: "hidden",
      boxShadow: "var(--shadow-card)",
    }}>
      <div style={{
        padding: "0.875rem 1.5rem",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface-muted)",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-hint)", fontWeight: 700, margin: 0 }}>
          {title}
        </p>
      </div>
      <div style={{ padding: "1rem 1.5rem" }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono = false, warn = false }: {
  label: string; value: string; mono?: boolean; warn?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "0.55rem 0", borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        color: warn ? "#D97706" : "var(--color-text-primary)",
        fontWeight: warn ? 600 : 400,
        maxWidth: "60%", textAlign: "left", wordBreak: "break-word",
      }}>
        {warn && value !== "—" ? "⚠ " : ""}{value}
      </span>
    </div>
  );
}



// ── Page ──────────────────────────────────────────────────────────────────────

export default function DriverDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const driverId = params?.driverId as string;

  const [driver, setDriver]           = useState<Driver | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  // Reset avatar error when photo changes after an update
  useEffect(() => {
    console.log(driver?.photoUrl);
    
    setAvatarError(false);
  }, [driver?.photoUrl]);
  // Toast shown after edit/delete actions on this page
  const [toast, setToast]             = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [editOpen, setEditOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Load driver ───────────────────────────────────────────────────────────
  const loadDriver = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await driverService.getById(driverId, token);
      setDriver((res as unknown as { data: Driver }).data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل بيانات السائق.");
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => { loadDriver(); }, [loadDriver]);

  // ── Edit submit ───────────────────────────────────────────────────────────
  const handleEditSubmit = useCallback(
    async (payload: CreateDriverPayload | UpdateDriverPayload, _isNew: boolean): Promise<boolean> => {
      if (!driver) return false;
      try {
        const token = getStoredToken();
        const typedPayload = payload as UpdateDriverPayload & {
          photo?: File; nationalPhoto?: File; driverCardPhoto?: File;
        };
        const hasFiles = typedPayload.photo || typedPayload.nationalPhoto || typedPayload.driverCardPhoto;

        if (hasFiles) {
          // Use multipart — JSON.stringify converts File to {} which fails validation
          await driverService.updateWithImages(driver.id, typedPayload, token);
        } else {
          await driverService.update(driver.id, typedPayload, token);
        }

        // Re-fetch to reflect updated status, name, photos, etc.
        await loadDriver();
        showToast("success", "تم تحديث بيانات السائق بنجاح.");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذّر تحديث بيانات السائق.";
        showToast("error", message);
        return false;
      }
    },
    [driver, loadDriver, showToast],
  );

  // ── Delete confirm ────────────────────────────────────────────────────────
  const handleConfirmDelete = useCallback(async () => {
    if (!driver) return;
    setDeleting(true);
    try {
      const token = getStoredToken();
      await driverService.delete(driver.id, token);
      router.push("/dashboard/drivers");
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذّر حذف السائق.";
      showToast("error", message);
      setDeleting(false);
    }
  }, [driver, router, showToast]);

  const statusConfig = driver ? DRIVER_STATUS_MAP[driver.status] : null;

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "6rem 0", color: "var(--color-text-muted)" }}>
        <Spinner size="sm" className="text-blue-600" />
        <span style={{ fontSize: 14 }}>جارٍ التحميل…</span>
      </div>
    );
  }

  // ── Render: Error ─────────────────────────────────────────────────────────
  if (error || !driver) {
    return (
      <div style={{ maxWidth: 480, margin: "4rem auto", borderRadius: "var(--radius-xl)", border: "1px solid #FECACA", background: "#FEF2F2", padding: "1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#DC2626", fontWeight: 600 }}>⚠ {error ?? "السائق غير موجود"}</p>
        <button type="button" onClick={() => router.back()} style={{
          marginTop: "1rem", height: 38, padding: "0 1.25rem",
          borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
          background: "var(--color-surface)", fontSize: 13, fontWeight: 600,
          color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)",
        }}>
          ← رجوع
        </button>
      </div>
    );
  }

  // ── Render: Driver detail ─────────────────────────────────────────────────
  return (
    <>
      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Toast notification ── */}
        {toast && (
          <div style={{
            borderRadius: "var(--radius-lg)",
            border: `1px solid ${toast.type === "success" ? "#BBF7D0" : "#FECACA"}`,
            background: toast.type === "success" ? "#DCFCE7" : "#FEF2F2",
            padding: "0.75rem 1.25rem",
            fontSize: 13,
            fontWeight: 600,
            color: toast.type === "success" ? "#166534" : "#DC2626",
          }}>
            {toast.type === "success" ? "✓ " : "⚠ "}{toast.message}
          </div>
        )}

        {/* ── Page header ── */}
        <header style={{
          borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
          background: "var(--color-surface)", padding: "1.5rem 2rem", boxShadow: "var(--shadow-card)",
        }}>
          <button type="button" onClick={() => router.back()} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            marginBottom: "1rem", fontFamily: "var(--font-sans)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            العودة إلى قائمة السائقين
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                border: "2px solid var(--color-brand-200)", background: "var(--color-surface-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {driver.photoUrl && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={driver.photoUrl} alt={driver.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatarError(true)} />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 700, color: "var(--color-brand-600)" }}>{driver.name.charAt(0)}</span>
                )}
              </div>

              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#2563EB", fontWeight: 600, margin: 0 }}>ملف السائق</p>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0" }}>{driver.name}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                  {driver.userName && (
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>@{driver.userName}</span>
                  )}
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{driver.phone}</span>
                  {statusConfig && (
                    <span style={{
                      borderRadius: "var(--radius-full)", border: `1px solid ${statusConfig.border}`,
                      background: statusConfig.bg, padding: "0.2rem 0.625rem",
                      fontSize: 11, fontWeight: 700, color: statusConfig.color,
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusConfig.dot, flexShrink: 0 }} />
                      {statusConfig.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={() => setDeleteOpen(true)} style={{
                height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-lg)",
                border: "1px solid #FECACA", background: "#FEF2F2",
                fontSize: 13, fontWeight: 700, color: "#DC2626", cursor: "pointer", fontFamily: "var(--font-sans)",
              }}>
                حذف السائق
              </button>
              <button type="button" onClick={() => setEditOpen(true)} style={{
                height: 40, padding: "0 1.25rem", borderRadius: "var(--radius-lg)",
                border: "none", background: "var(--color-brand-600)",
                fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                تعديل السائق
              </button>
            </div>
          </div>
        </header>

        {/* ── Content grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <SectionCard title="البيانات الشخصية">
            <DetailRow label="الاسم الكامل"     value={driver.name} />
            <DetailRow label="رقم الجوال"        value={driver.phone} mono />
            <DetailRow label="البريد الإلكتروني" value={driver.email ?? "—"} />
            <DetailRow label="العنوان"           value={driver.address ?? "—"} />
            <DetailRow label="الجنسية"           value={driver.nationality ?? "—"} />
            <DetailRow label="الفرع"             value={driver.branch?.name ?? "—"} />
            <DetailRow label="نوع السائق"        value={driver.driverType ?? "—"} />
          </SectionCard>

          <SectionCard title="الهوية والتأمينات">
            <DetailRow label="نوع الهوية" value={driver.nationalIdType ? NATIONAL_ID_TYPE_MAP[driver.nationalIdType] : "—"} />
            <DetailRow label="رقم الهوية" value={driver.nationalId ?? "—"} mono />
            <DetailRow label="انتهاء الهوية" value={fmtDate(driver.nationalIdExpiry)} warn={isExpiringSoon(driver.nationalIdExpiry)} />
            <DetailRow label="رقم GOSI" value={driver.gosiNumber ?? "—"} mono />
          </SectionCard>

          <SectionCard title="بيانات رخصة القيادة">
            <DetailRow label="رقم الرخصة" value={driver.licenseNumber ?? "—"} mono />
            <DetailRow label="نوع الرخصة" value={driver.licenseType ?? "—"} />
            <DetailRow label="انتهاء الرخصة" value={fmtDate(driver.licenseExpiry)} warn={isExpiringSoon(driver.licenseExpiry)} />
          </SectionCard>

          <SectionCard title="بطاقة السائق">
            <DetailRow label="رقم البطاقة" value={driver.driverCardNumber ?? "—"} mono />
            <DetailRow label="نوع البطاقة" value={driver.driverCardType ? DRIVER_CARD_TYPE_MAP[driver.driverCardType] : "—"} />
            <DetailRow label="انتهاء البطاقة" value={fmtDate(driver.driverCardExpiry)} warn={isExpiringSoon(driver.driverCardExpiry)} />
          </SectionCard>

          <SectionCard title="معلومات النظام">
            <DetailRow label="اسم المستخدم"  value={driver.userName ?? "—"} mono />
            <DetailRow label="تاريخ الإضافة" value={fmtDate(driver.createdAt)} />
            <DetailRow label="آخر تحديث"     value={fmtDate(driver.updatedAt)} />
          </SectionCard>

          {driver.statusHistory && driver.statusHistory.length > 0 && (
            <SectionCard title="سجل الحالات">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {driver.statusHistory.map((h) => {
                  const s = DRIVER_STATUS_MAP[h.status] ?? DRIVER_STATUS_MAP.Active;
                  return (
                    <div key={h.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderRadius: "var(--radius-md)", border: `1px solid ${s.border}`,
                      background: s.bg, padding: "0.5rem 0.875rem",
                    }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                        {h.reason && <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginRight: 8 }}>— {h.reason}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{fmtDate(h.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </div>

        <SectionCard title="الصور والمستندات">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            <PhotoCard url={driver.photoUrl}           label="صورة السائق" />
            <PhotoCard url={driver.nationalPhotoUrl}   label="صورة الهوية" />
            <PhotoCard url={driver.driverCardPhotoUrl} label="صورة بطاقة السائق" />
          </div>
        </SectionCard>

        <div style={{
          borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
          background: "var(--color-surface)", boxShadow: "var(--shadow-card)", padding: "1.5rem",
        }}>
          <DriverReportPanel driverId={driver.id} />
        </div>
      </section>

      {editOpen && (
        <DriverFormModal
          editDriver={driver}
          branches={[]}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteOpen && (
        <DriverDeleteModal
          driver={driver}
          deleting={deleting}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}