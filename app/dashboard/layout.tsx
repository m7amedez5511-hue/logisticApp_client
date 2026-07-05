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
        // #sb-compact is `position: fixed; right: 0` (inline-start
        // in RTL), so the content needs its reserved space on
        // paddingInlineSTART — not End. End resolved to the wrong
        // physical side (left) and let the fixed rail sit on top
        // of the content on md screens. Using the CSS var instead
        // of a hardcoded "72px" also keeps this in sync with
        // --sidebar-width-compact if that token ever changes.
        el.style.paddingInlineStart = "var(--sidebar-width-compact)";
      } else {
        el.style.paddingInlineStart = "0px";
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