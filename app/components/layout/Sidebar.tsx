"use client";

import Link      from "next/link";
import { usePathname } from "next/navigation";
import { getStoredUser } from "@/src/lib/auth";
import Logo from "@/src/utils/logo";

const navSections = [
  {
    label: "الرئيسية",
    items: [
      { href: "/dashboard", label: "Dashboard",   icon: "ti-layout-dashboard", permission: "read-dashboard" },
      { href: "/dashboard/users",     label: "Users",        icon: "ti-users",            permission: "read-user"      },
    ],
  },
  {
    label: "الأسطول",
    items: [
      { href: "/dashboard/cars",    label: "Cars",    icon: "ti-car",           permission: "read-car"    },
      { href: "/dashboard/drivers", label: "Drivers", icon: "ti-steering-wheel",permission: "read-driver" },
      { href: "/dashboard/trips",   label: "Trips",   icon: "ti-route",         permission: "read-trip"   },
    ],
  },
  {
    label: "العمليات",
    items: [
      { href: "/dashboard/orders",   label: "Orders",   icon: "ti-package",     permission: "read-order"  },
      { href: "/dashboard/clients",  label: "Clients",  icon: "ti-users-group", permission: "read-client" },
      { href: "/dashboard/branches", label: "Branches", icon: "ti-building",    permission: "read-branch" },
      { href: "/dashboard/roles",    label: "Roles",    icon: "ti-shield",      permission: "read-role"   },
      { href: "/dashboard/role_permission",    label: "Roles & Permission",    icon: "ti-shield",      permission: "manage-role-permissions"   },
      { href: "/dashboard/audit",    label: "Audit",    icon: "ti-clipboard-list", permission: "read-audit" },
    ],
  },
];

export function Sidebar() {
  const pathname    = usePathname();
  const user        = getStoredUser();
  const permissions = user?.permissions ?? navSections.flatMap(s => s.items.map(i => i.permission));

  return (
    <>
      {/*
        Full sidebar — visible lg+.
        No `left`/`right` is set anywhere: placement comes purely from
        document order + `dir="rtl"` on <html>. A flex row in RTL lays
        its first child against the inline-start edge, which is
        physically the RIGHT of the screen. Because <Sidebar /> is
        still the first child in DashboardLayout, it now renders on
        the right automatically — no positional CSS to flip.
      */}
      <aside
        suppressHydrationWarning
        className="hidden lg:flex lg:flex-col"
        style={{
          width: "var(--sidebar-width)",
          flexShrink: 0,
          background: "linear-gradient(175deg, #1E3A8A 0%, #1D4ED8 60%, #1565C0 100%)",
          minHeight: "100vh",
          padding: "20px 12px",
        }}
      >
        <SidebarContent
          pathname={pathname}
          permissions={permissions}
          user={user}
          compact={false}
        />
      </aside>

      {/*
        Compact icon rail — md and below (replaces the old behavior of
        hiding the sidebar entirely under `lg`). Fixed to the
        inline-end... no: fixed to the RIGHT edge explicitly, because a
        `position: fixed` element takes no part in flex flow and so
        gets no automatic RTL placement from document order. This is
        exactly the kind of element logical properties exist for:
        `inset-inline-end: 0` means "right in RTL, left in LTR"
        without a manual swap if direction ever toggles.
      */}
      <aside
        suppressHydrationWarning
        className="hidden md:flex lg:hidden md:flex-col md:items-center"
        style={{
          position: "fixed",
          insetBlockStart: 0,
          insetBlockEnd: 0,
          insetInlineEnd: 0,
          width: "var(--sidebar-width-compact)",
          background: "linear-gradient(175deg, #1E3A8A 0%, #1D4ED8 60%, #1565C0 100%)",
          padding: "16px 0",
          zIndex: 30,
          overflowY: "auto",
        }}
        aria-label="التنقل المصغر"
      >
        <SidebarContent
          pathname={pathname}
          permissions={permissions}
          user={user}
          compact={true}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  permissions,
  user,
  compact,
}: {
  pathname: string;
  permissions: string[];
  user: ReturnType<typeof getStoredUser>;
  compact: boolean;
}) {
  return (
    <>
      {/* Logo */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: compact ? "center" : "flex-start" }}>
        <Logo white />
      </div>

      {/* Nav sections */}
      <nav
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, width: "100%" }}
        aria-label="Main navigation"
      >
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            {!compact && (
              <p style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                padding: "8px 8px 4px",
                fontWeight: 600,
                textAlign: "start",
              }}>
                {section.label}
              </p>
            )}

            {section.items.map((item) => {
              const allowed = item.permission === "read-dashboard"
                || permissions.includes(item.permission);
              if (!allowed) return null;

              const active = pathname === item.href
                || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={compact ? item.label : undefined}
                  aria-label={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: compact ? "center" : "flex-start",
                    gap: 9,
                    padding: compact ? "10px" : "7px 8px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                    background: active ? "rgba(255,255,255,0.15)" : "transparent",
                    textDecoration: "none",
                    transition: "var(--transition-base)",
                    marginBottom: 2,
                    textAlign: "start",
                  }}
                >
                  <i
                    className={`ti ${item.icon}`}
                    aria-hidden="true"
                    style={{ fontSize: compact ? 18 : 16, flexShrink: 0 }}
                  />
                  {!compact && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User badge — collapses to an avatar dot in compact mode */}
      {compact ? (
        <div
          suppressHydrationWarning
          title={user?.name ?? user?.userName ?? "—"}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            marginTop: 8,
          }}
        >
          {(user?.name ?? user?.userName ?? "—").slice(0, 1)}
        </div>
      ) : (
        <div style={{
          background: "rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "10px 12px",
          marginTop: 8,
          width: "100%",
        }}>
          <p suppressHydrationWarning style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0, textAlign: "start" }}>
            {user?.name ?? user?.userName ?? "—"}
          </p>
          <p suppressHydrationWarning style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2, textAlign: "start" }}>
            {user?.role ?? "Signed in"}
          </p>
        </div>
      )}
    </>
  );
}