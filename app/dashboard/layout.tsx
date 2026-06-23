import { Sidebar } from "../components/layout/Sidebar";
import { Topbar }  from "../components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--color-surface-muted)" }}
    >
      {/*
        Sidebar is still the first flex child. With dir="rtl" on <html>
        (set in app/layout.tsx) this is enough to place the full
        sidebar on the right with no positional CSS — see Sidebar.tsx.
      */}
      <Sidebar />

      {/*
        The compact icon rail (md and below) is `position: fixed`, so it
        doesn't take up flex space. This wrapper reserves room for it
        with `paddingInlineEnd`, which means "right padding in RTL,
        left padding in LTR" — it never needs to be touched again if
        direction changes.
      */}
      <div
        className="flex min-w-0 flex-1 flex-col md:[padding-inline-end:var(--sidebar-width-compact)] lg:[padding-inline-end:0]"
      >
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}