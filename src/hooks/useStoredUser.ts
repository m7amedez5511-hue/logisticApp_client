// src/hooks/useStoredUser.ts
// NEW FILE — Issue 3.
// Cheap, synchronous, locally-cached display value (name/avatar in topbar).
// This is deliberately NOT merged with useCurrentUser.ts, which fetches the
// authoritative server-side user via userService.getMe for pages that need
// fresh data. useStoredUser only reflects what's already in localStorage.
"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/src/lib/auth";
import type { AuthUser } from "@/src/types/auth";

export function useStoredUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Avoid calling getStoredUser() during the initial render pass to
    // prevent SSR/CSR hydration mismatches — read only inside the effect.
    setUser(getStoredUser());
    setLoading(false);

    const handler = () => setUser(getStoredUser());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { user, loading };
}