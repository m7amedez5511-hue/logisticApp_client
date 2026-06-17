"use client";

import { useRouter } from "next/navigation";
import { clearAuth, getStoredUser } from "../../../lib/auth";

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
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
          لوحة التحكم
        </p>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
          Operations dashboard
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