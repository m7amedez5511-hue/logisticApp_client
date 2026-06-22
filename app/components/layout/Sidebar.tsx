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
      {/* Logo */}
      <div style={{ marginBottom: 28 }}>
        <Logo white />
      </div>

      {/* Nav sections */}
      <nav
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}
        aria-label="Main navigation"
      >
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            <p style={{
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              padding: "8px 8px 4px",
              fontWeight: 600,
            }}>
              {section.label}
            </p>

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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "7px 8px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                    background: active ? "rgba(255,255,255,0.15)" : "transparent",
                    textDecoration: "none",
                    transition: "var(--transition-base)",
                    marginBottom: 2,
                  }}
                >
                  <i
                    className={`ti ${item.icon}`}
                    aria-hidden="true"
                    style={{ fontSize: 16 }}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User badge */}
      <div style={{
        background: "rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "10px 12px",
        marginTop: 8,
      }}>
        <p suppressHydrationWarning style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>
          {user?.name ?? user?.userName ?? "—"}
        </p>
        <p suppressHydrationWarning style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
          {user?.role ?? "Signed in"}
        </p>
      </div>
    </aside>
  );
}