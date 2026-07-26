"use client";



import { AuditLog } from "@/src/types/audit";
import { Button, Modal } from "../UI";
import { ActionBadge } from "./AuditTable";

interface AuditDetailModalProps {
  log: AuditLog;
  onClose: () => void;
}

// ── small helper components ───────────────────────────────────────────────
// (Same rationale as UserDetailModal's: purpose-built layouts, not generic
// form/action controls, so they stay custom rather than pulled from the
// shared UI kit.)

function DetailRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      padding: "0.75rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 500,
        fontFamily: mono ? "var(--font-mono)" : undefined,
        color: value ? "var(--color-text-primary)" : "var(--color-text-hint)",
        wordBreak: "break-word",
      }}>
        {value || "—"}
      </span>
    </div>
  );
}

// Stands in for UserDetailModal's <Avatar/> — a log entry has no photo, so
// this is a colored icon circle instead of initials.
function ActionIcon() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: "50%",
      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(37,99,235,.3)",
    }}>
      <i className="ti ti-clipboard-check" style={{ fontSize: 26, color: "#FFF" }} aria-hidden="true" />
    </div>
  );
}

function MetadataBlock({ metadata }: { metadata: Record<string, unknown> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.75rem 0" }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-muted)" }}>
        بيانات إضافية
      </span>
      <pre style={{
        margin: 0,
        padding: "0.75rem",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface-muted)",
        border: "1px solid var(--color-border)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--color-text-secondary)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        direction: "ltr",
        textAlign: "left",
      }}>
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────
export function AuditDetailModal({ log, onClose }: AuditDetailModalProps) {
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString("ar-SA", { dateStyle: "long", timeStyle: "medium" }) : null;

  return (
    <Modal
      open
      title="تفاصيل السجل"
      subtitle="سجل التدقيق"
      onClose={onClose}
      size="md"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }} dir="rtl">

        {/* icon + action + timestamp row */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem",
          padding: "0 0 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "0.25rem",
        }}>
          <ActionIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              {log.module ?? "سجل تدقيق"}
            </p>
            <p style={{ marginTop: 3, fontSize: 12, color: "var(--color-text-muted)" }}>
              {fmt(log.createdAt)}
            </p>
            <div style={{ marginTop: 8 }}>
              <ActionBadge action={log.action} />
            </div>
          </div>
        </div>

        {/* detail rows */}
        <DetailRow label="المعرّف"        value={log.entityId} mono />
        <DetailRow label="المستخدم"       value={log.userName ?? log.userId} />
        <DetailRow label="عنوان IP"       value={log.ipAddress} mono />
        <DetailRow label="متصفح المستخدم" value={log.userAgent} mono />

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <MetadataBlock metadata={log.metadata} />
        )}
      </div>
    </Modal>
  );
}