"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarProvider } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";

function DashShell({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function applyPadding() {
      if (!el) return;
      const w = window.innerWidth;
      if (w >= 768 && w < 1024) {
        
        el.style.paddingInlineEnd = "72px";
      } else {
        el.style.paddingInlineEnd = "0px";
      }
    }

    applyPadding();
    window.addEventListener("resize", applyPadding);
    return () => window.removeEventListener("resize", applyPadding);
  }, [pathname]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-surface-muted)",
      }}
    >
      <Sidebar />
      <div
        ref={contentRef}
        id="dash-content"
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Topbar />
        <main style={{ flex: 1, padding: "1.7rem" }}>{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashShell>{children}</DashShell>
    </SidebarProvider>
  );
}