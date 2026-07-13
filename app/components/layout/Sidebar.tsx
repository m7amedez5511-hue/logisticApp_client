"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";
import { getStoredUser } from "@/src/lib/auth";
import Logo from "@/src/utils/logo";
import BrandIcon from "@/src/utils/brandIcon";

//ــــــــــــــ Drawer Context

const DrawerCtx = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useSidebarDrawer() {
  return useContext(DrawerCtx);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DrawerCtx.Provider value={{ open, setOpen }}>
      {children}
    </DrawerCtx.Provider>
  );
}

/* ══════════════════════════════════════════
   Nav items
══════════════════════════════════════════ */
const navSections = [
  {
    label: "الرئيسية",
    items: [
      {
        href: "/dashboard",
        label: "لوحة التحكم",
        icon: "ti-layout-dashboard",
        permission: "read-dashboard",
      },
      {
        href: "/dashboard/users",
        label: "المستخدمون",
        icon: "ti-users",
        permission: "read-user",
      },
    ],
  },
  {
    label: "الأسطول",
    items: [
      {
        href: "/dashboard/cars",
        label: "السيارات",
        icon: "ti-car",
        permission: "read-car",
      },
      {
        href: "/dashboard/drivers",
        label: "السائقون",
        icon: "ti-steering-wheel",
        permission: "read-driver",
      },
      {
        href: "/dashboard/trips",
        label: "الرحلات",
        icon: "ti-route",
        permission: "read-trip",
      },
    ],
  },
  {
    label: "العمليات",
    items: [
      {
        href: "/dashboard/orders",
        label: "الطلبات",
        icon: "ti-package",
        permission: "read-order",
      },
      {
        href: "/dashboard/clients",
        label: "العملاء",
        icon: "ti-users-group",
        permission: "read-client",
      },
      {
        href: "/dashboard/branches",
        label: "الفروع",
        icon: "ti-building",
        permission: "read-branch",
      },
      {
        href: "/dashboard/roles",
        label: "الادوار",
        icon: "ti-shield",
        permission: "read-role",
      },
      {
        href: "/dashboard/audit",
        label: "سجل العمليات",
        icon: "ti-clipboard-list",
        permission: "read-audit",
      },
    ],
  },
];

/* ══════════════════════════════════════════
   Brand Icon
══════════════════════════════════════════ */

export function BrandIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="فتح القائمة"
      style={{
        background: "transparent",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        width: 36,
        height: 36,
        padding: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <BrandIcon size={28} bg="#2563EB" />
    </button>
  );
}

const GRAD = "linear-gradient(175deg, #1E3A8A 0%, #1D4ED8 60%, #1565C0 100%)";

/* ══════════════════════════════════════════
   Sidebar
   ⚠️  NO display property in any inline style here
       globals.css controls ALL display with !important
══════════════════════════════════════════ */
export function Sidebar() {
  const pathname = usePathname();
  const user = getStoredUser();
  const permissions =
    user?.permissions ??
    navSections.flatMap((s) => s.items.map((i) => i.permission));
  const { open, setOpen } = useSidebarDrawer();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ══ 1. Full sidebar — lg+ ══*/}
      <aside
        id="sb-full"
        suppressHydrationWarning
        style={{
          background: GRAD,
          flexDirection: "column" /* NO display property */,
          width: "var(--sidebar-width)",
          flexShrink: 0,
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

      {/* ══ 2. Compact rail */}
      <aside
        id="sb-compact"
        suppressHydrationWarning
        aria-label="التنقل المصغر"
        style={{
          background: GRAD,
          flexDirection: "column" /* NO display property */,
          alignItems: "center",
          position: "fixed",
          top: 0,
          bottom: 0,
          right: 0,
          left: "auto",
          width: "var(--sidebar-width-compact)",
          padding: "16px 0",
          zIndex: 30,
          overflowY: "auto",
        }}
      >
        <SidebarContent
          pathname={pathname}
          permissions={permissions}
          user={user}
          compact={true}
        />
      </aside>

      {/* mobile drower*/}

      {/* open drower*/}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}

      {/* Drawer panel */}
      <aside
        id="sb-drawer"
        suppressHydrationWarning
        aria-label="قائمة التنقل"
        style={{
          background: GRAD,
          flexDirection: "column" /* NO display property */,
          position: "fixed",
          top: 0,
          bottom: 0,
          right: 0,
          left: "auto",
          width: "var(--sidebar-width)",
          padding: "20px 12px",
          zIndex: 50,
          overflowY: "auto",

          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/*close button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="إغلاق القائمة"
          style={{
            position: "absolute",
            top: 14,
            left: 12,
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: 8,
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <SidebarContent
          pathname={pathname}
          permissions={permissions}
          user={user}
          compact={false}
        />
      </aside>
    </>
  );
}

/* ══════════════════════════════════════════
   SidebarContent
══════════════════════════════════════════ */
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
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: compact ? "center" : "flex-start",
        }}
      >
        {compact ? <BrandIcon size={36} /> : <Logo white />}
      </div>

      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
        aria-label="Main navigation"
      >
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            {!compact && (
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  padding: "8px 8px 4px",
                  fontWeight: 600,
                  textAlign: "start",
                  margin: 0,
                }}
              >
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const allowed =
                item.permission === "read-dashboard" ||
                permissions.includes(item.permission);
              if (!allowed) return null;
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href + "/"));
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
                    background: active
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
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
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "10px 12px",
            marginTop: 8,
            width: "100%",
          }}
        >
          <p
            suppressHydrationWarning
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              margin: 0,
              textAlign: "start",
            }}
          >
            {user?.name ?? user?.userName ?? "—"}
          </p>
          <p
            suppressHydrationWarning
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
              marginTop: 2,
              textAlign: "start",
            }}
          >
            {user?.role ?? "Signed in"}
          </p>
        </div>
      )}
    </>
  );
}
