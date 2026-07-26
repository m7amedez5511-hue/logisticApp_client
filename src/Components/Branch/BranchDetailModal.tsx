"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Modal, Spinner } from "../UI";
import { getStoredToken } from "@/src/lib/auth";
import { branchService } from "@/src/services/branch.service";
import type { BranchDetail } from "@/src/types/branch";

interface BranchDetailModalProps {
  branchId: string;
  onClose:  () => void;
}

// ── small helper components (no template exists for a plain label/value row) ──
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

// Branch icon badge has no equivalent in the shared UI kit — kept custom.
function BranchIcon() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(37,99,235,.3)",
    }}>
      <i className="ti ti-building" style={{ fontSize: 26, color: "#FFF" }} aria-hidden="true" />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function BranchDetailModal({ branchId, onClose }: BranchDetailModalProps) {
  const [branch,  setBranch]  = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // fetch branch details on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getStoredToken();
        const data = await branchService.getById(branchId, token);
        if (!cancelled) setBranch(data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل بيانات الفرع. يرجى المحاولة لاحقاً.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [branchId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;

  const fullAddress = (b: BranchDetail) =>
    [b.street, b.district, b.city, b.state, b.country].filter(Boolean).join("، ") || null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      open
      title={branch?.name ?? "عرض الفرع"}
      subtitle="بيانات الفرع"
      onClose={onClose}
      size="md"
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
      {!loading && error && <Alert type="error" message={error} />}

      {/* content */}
      {!loading && branch && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }} dir="rtl">

          {/* icon + name + status row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0 0 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "0.25rem",
          }}>
            <BranchIcon />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{branch.name}</p>
              {branch.city && (
                <p style={{ marginTop: 3, fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                  {branch.city}
                </p>
              )}
              <div style={{ marginTop: 8 }}>
                <Badge label={branch.isActive ? "نشط" : "معطل"} color={branch.isActive ? "green" : "red"} />
              </div>
            </div>
          </div>

          {/* detail rows */}
          <DetailRow label="رقم الهاتف"        value={branch.phone} />
          <DetailRow label="البريد الإلكتروني"  value={branch.email} />
          <DetailRow label="العنوان"            value={fullAddress(branch)} />
          <DetailRow label="رقم المبنى"         value={branch.buildingNo} />
          <DetailRow label="رقم الوحدة"         value={branch.unitNo} />
          <DetailRow label="الرمز البريدي"      value={branch.zipCode} />
          <DetailRow
            label="الموقع الجغرافي"
            value={branch.latitude != null && branch.longitude != null
              ? `${branch.latitude}, ${branch.longitude}`
              : null}
          />
          <DetailRow label="تاريخ الإنشاء"      value={fmt(branch.createdAt)} />
          <DetailRow label="آخر تحديث"          value={fmt(branch.updatedAt)} />
        </div>
      )}
    </Modal>
  );
}