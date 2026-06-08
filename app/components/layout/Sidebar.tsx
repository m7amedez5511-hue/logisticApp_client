// File: app/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
// FIX: Import getStoredUser so the sidebar reads the authenticated user's
// name and role from localStorage instead of showing hardcoded placeholders.
import { getStoredUser } from "../../../src/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", permission: "read-dashboard" },
  { href: "/users",     label: "Users",     permission: "read-user" },
  { href: "/cars",      label: "Cars",      permission: "read-car" },
  { href: "/drivers",   label: "Drivers",   permission: "read-driver" },
  { href: "/clients",   label: "Clients",   permission: "read-client" },
  { href: "/orders",    label: "Orders",    permission: "read-order" },
  { href: "/trips",     label: "Trips",     permission: "read-trip" },
  { href: "/branches",  label: "Branches",  permission: "read-branch" },
  { href: "/roles",     label: "Roles",     permission: "read-role" },
  { href: "/audit",     label: "Audit",     permission: "read-audit" },
];

export function Sidebar() {
  // FIX: Read the stored user on render. suppressHydrationWarning handles
  // the SSR/CSR mismatch since localStorage is browser-only.
  const user = getStoredUser();
  const permissions = user?.permissions ?? navItems.map((i) => i.permission);

  return (
    <aside
      suppressHydrationWarning
      className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/80 p-6 lg:flex lg:flex-col"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Logistics</p>
        <h2 className="mt-3 text-xl font-semibold text-white">Ops Console</h2>
        <p className="mt-2 text-sm text-slate-300">
          Fleet, clients, orders, and compliance in one place.
        </p>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          // FIX: Check the real user permissions array fetched from stored auth.
          // Dashboard is always visible regardless of permissions.
          const hasPermission =
            item.permission === "read-dashboard" ||
            permissions.includes(item.permission);
          if (!hasPermission) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/30 hover:bg-slate-800"
            >
              <span>{item.label}</span>
              <span className="text-xs text-slate-400">→</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">Authenticated</p>
        {/* FIX: Show the real user name and role from the stored auth session,
            replacing the previous hardcoded "Operations user" / "Signed in" text. */}
        <p suppressHydrationWarning className="mt-2 font-semibold">
          {user?.name ?? user?.userName ?? "—"}
        </p>
        <p suppressHydrationWarning className="text-xs text-emerald-100/90">
          {user?.role ? `Role: ${user.role}` : "Signed in"}
        </p>
      </div>
    </aside>
  );
}