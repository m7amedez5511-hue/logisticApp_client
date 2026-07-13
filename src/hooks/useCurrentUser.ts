"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { userService, extractMeUser } from "@/src/services/user.service";
import type { UserMe } from "@/src/types/user";

export function useCurrentUser() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await userService.getMe(token);
      const u = extractMeUser(res.data ?? res);
      if (!u) throw new Error("لا توجد بيانات");
      setUser(u as UserMe);
    } catch {
      setError("تعذر تحميل بيانات الحساب. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, loading, error, reload: load };
}