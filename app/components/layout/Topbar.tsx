"use client";

import { useRouter } from "next/navigation";
import { clearAuth, getStoredUser } from "@/src/lib/auth";

export function Topbar() {
  const router = useRouter();

  async function handleLogout() {
    await clearAuth();
    router.replace("/login");
  }

  const user = getStoredUser();

  return (
    <header
      suppressHydrationWarning
      style={{
        height: "var(--topbar-height)",
        background: "#FFFFFF",
        borderBottom: "1px solid var(--color-border)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        /*
          `justify-content: space-between` and `display: flex` are
          direction-agnostic — they already flip with `dir` for free.
          The title block (first child) lands at the inline-start edge
          (right, in RTL) and the actions cluster (second child) lands
          at inline-end (left). That matches the brief's "primary
          actions easily accessible" requirement: in Arabic dashboards
          the page title reads first at the right, and the role badge
          + logout sit together at the natural reading end — unchanged
          from before, just now correctly positioned by `dir` instead
          of by accident.
        */
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0, textAlign: "start" }}>
          لوحة التحكم
        </p>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, textAlign: "start" }}>
          {/* English product label intentionally stays LTR-embedded so
              "Operations dashboard" doesn't get its word order or
              punctuation reversed by the surrounding RTL run. */}
          <span className="ltr-embed">Operations dashboard</span>
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          suppressHydrationWarning
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            background: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            padding: "4px 12px",
          }}
        >
          {user?.role ?? "—"}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#DC2626",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "var(--radius-full)",
            padding: "5px 14px",
            cursor: "pointer",
            transition: "var(--transition-base)",
          }}
        >
          تسجيل الخروج
        </button>
      </div>
    </header>
  );
}