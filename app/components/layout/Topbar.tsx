"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth } from "../../../src/lib/auth";

export function Topbar() {
  const router = useRouter();

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <header suppressHydrationWarning className="border-b border-white/10 bg-slate-950/70 px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Operations dashboard</p>
          <h1 className="text-xl font-semibold text-white lg:text-2xl">Logistics delivery management</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">Overview</Link>
          <div suppressHydrationWarning className="hidden rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 md:block">Manager</div>
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
