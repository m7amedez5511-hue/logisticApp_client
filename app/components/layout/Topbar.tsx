// File: app/components/layout/Topbar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
// FIX: Import both clearAuth and getStoredUser so the topbar can show the
// authenticated user's role and handle logout properly.
import { clearAuth, getStoredUser } from "../../../src/lib/auth";

export function Topbar() {
  const router = useRouter();

  function handleLogout() {
    // FIX: clearAuth already existed and is correct — it removes both the
    // token and user from localStorage, fully ending the session.
    clearAuth();
    router.replace("/login");
  }

  // FIX: Read the stored user to display their real role in the header
  // instead of the hardcoded "Manager" placeholder.
  const user = getStoredUser();
  // Capitalize the role label for display (e.g. "admin" → "Admin")
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "—";

  return (
    <header
      suppressHydrationWarning
      className="border-b border-white/10 bg-slate-950/70 px-4 py-4 lg:px-6"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
            Operations dashboard
          </p>
          <h1 className="text-xl font-semibold text-white lg:text-2xl">
            Logistics delivery management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Overview
          </Link>
          {/* FIX: Replace the hardcoded "Manager" string with the actual
              authenticated user's role read from localStorage. */}
          <div
            suppressHydrationWarning
            className="hidden rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 md:block"
          >
            {roleLabel}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-rose-500/10 px-4 py-2 text-sm text-rose-100 hover:bg-rose-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}