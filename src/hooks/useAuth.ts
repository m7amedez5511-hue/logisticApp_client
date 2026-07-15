"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { saveAuth } from "@/src/lib/auth";
import { authService } from "@/src/services/auth.service";
import type { AuthUser, LoginRequest, User } from "@/src/types/auth";
import { detectIdentityField } from "@/src/validations/auth.validator";

type RawRole = { name?: string; permissions?: Array<{ permission?: { slug?: string } }> } | string;

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (identity: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const field = detectIdentityField(identity);
      const payload: LoginRequest = { password };

      if (field) {
        payload[field] = identity;
      }

      const response = await authService.login(payload);
      const envelope = (response as { data?: { data?: { token?: string; user?: User }; token?: string; user?: User } }).data ?? response;
      const body = (envelope as { data?: { token?: string; user?: User }; token?: string; user?: User }).data ?? envelope;
      const token = body?.token;
      const user = body?.user;

      if (!token || !user) {
        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة.");
      }

      const rawRole = (user as unknown as { role?: RawRole }).role;
      const roleName = typeof rawRole === "string"
        ? rawRole
        : typeof rawRole === "object" && rawRole !== null
          ? rawRole.name
          : undefined;

      const rolePermissions =
        typeof rawRole === "object" && rawRole !== null
          ? (rawRole as Exclude<RawRole, string>).permissions ?? []
          : [];

      const permissions = Array.isArray(rolePermissions)
        ? rolePermissions
            .map((entry) => entry?.permission?.slug)
            .filter((slug): slug is string => Boolean(slug))
        : [];

      const normalizedUser: AuthUser = { ...user, role: roleName, permissions };
      saveAuth(token, normalizedUser);
      router.replace("/dashboard");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع. يرجى المحاولة لاحقًا.";
      const normalized = message.toLowerCase();

      if (normalized.includes("network") || normalized.includes("fetch") || normalized.includes("timeout")) {
        setError("تعذر الاتصال بالخادم. يرجى التحقق من الاتصال والمحاولة مرة أخرى.");
      } else if (normalized.includes("401") || normalized.includes("unauthorized")) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
      } else {
        setError(message);
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { login, loading, error, clearError };
}
