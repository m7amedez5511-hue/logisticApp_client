
"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredToken } from "@/src/lib/auth";
import { userService, extractMeUser } from "@/src/services/user.service";
import { translateError } from "@/src/lib/translateError"; // 1. import translator
import type { UserMe } from "@/src/types/user";

export function useCurrentUser() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      //1. get token from local storage
      const token = getStoredToken();
      //2. call userService.getMe(token) to get the current user
      const res = await userService.getMe(token);
      // console.log("useCurrentUser: got me", res);
      //3. extract the user from the response using extractMeUser(res)
      const u = extractMeUser(res);
      //4. if user is null, throw an error
      if (!u) throw new Error("لا توجد بيانات");
      setUser(u as UserMe);
    } catch (err) {
      // 5. Try translateError first; fall back to the existing generic message.
      const normalized = translateError(err);
      setError(normalized.kind === "unknown" ? "تعذر تحميل بيانات الحساب. حاول مرة أخرى." : normalized.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, loading, error, reload: load };
}