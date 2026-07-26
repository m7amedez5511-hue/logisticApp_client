// app/components/layout/Topbar.tsx
"use client";

import { useRouter } from "next/navigation";
import { clearAuth } from "@/src/lib/auth";
import { useStoredUser } from "@/src/hooks/useStoredUser";
import { Spinner } from "@/src/Components/UI/Spinner";
import { useSidebarDrawer, BrandIconButton } from "./Sidebar";

export function Topbar() {
  const router = useRouter();
  const { setOpen } = useSidebarDrawer();

  const { user, loading } = useStoredUser();

  async function handleLogout() {
    await clearAuth();
    router.replace("/login");
  }

  return (
    <header
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
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0, textAlign: "start" }}>
          لوحة التحكم
        </p>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, textAlign: "start" }}>
          <span className="ltr-embed">Operations dashboard</span>
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div id="topbar-menu-btn">
          <BrandIconButton onClick={() => setOpen(true)} />
        </div>

        {/* زرار "حسابي" — بيروح لصفحة البروفايل، مع hover بيغير اللون ويعمل scale بسيط */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/profile")}
          className="group flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-[5px] text-xs font-medium text-slate-600 transition-all duration-150 hover:scale-105 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <i className="ti ti-user text-[14px]" aria-hidden="true" />
          حسابي
        </button>

        {/*
          Loading guard: InlineLoader is meant for card/section-level loading
          (py-4 + message text) and doesn't fit a small inline pill here, so
          we use the same underlying <Spinner size="sm" /> the project already
          ships, just placed inside the existing badge shell.
        */}
        <div
          role="status"
          aria-label={loading ? "جارِ التحميل" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "var(--color-text-secondary)",
            background: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            padding: loading ? "4px 10px" : "4px 12px",
            minWidth: 40,
          }}
        >
          {loading ? (
            <Spinner size="sm" className="text-[var(--color-text-muted)]" />
          ) : (
            user?.role ?? "—"
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            fontSize: 12, fontWeight: 500,
            color: "#DC2626", background: "#FEF2F2",
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