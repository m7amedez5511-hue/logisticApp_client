
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { loginUser } from "@/src/lib/auth";
import { detectIdentityField } from "@/src/validations/auth.validator";
import { translateError } from "@/src/lib/translateError"; // 1. import translator

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (identity: string, password: string) => {
    setError(null);

    // ── Edge case 1: unidentifiable input rejected locally ──────────────
    // detectIdentityField() returns null for empty/garbage identity strings
    // (not a valid email, not a Saudi phone, not a username ≥2 chars).
    // Previously this fell through silently and sent { password } alone
    // to the backend. Now we fail fast with a clear Arabic message and
    // never issue the request.
    if (!detectIdentityField(identity)) {
      setError(
        "يجب إدخال بريد إلكتروني صحيح أو رقم هاتف سعودي صحيح أو اسم مستخدم لا يقل عن حرفين.",
      );
      return false;
    }

    setLoading(true);
    try {
      // ── FIX: delegate to loginUser() instead of duplicating the
      // unwrap → block-check → saveAuth flow inline here.
      // loginUser() is now the single source of truth and already:
      //   1. builds the typed LoginRequest via detectIdentityField()
      //   2. unwraps both possible response envelope shapes
      //   3. rejects BLOCKED_ROLES ("driver" / "سائق") BEFORE any
      //      storage write — this check was completely missing from
      //      useAuth.ts's previous inline implementation
      //   4. persists the HttpOnly cookie via POST /api/auth/set-cookie;
      //      a failure there is caught + console.warn'd *inside*
      //      loginUser(), so login still succeeds via the fallback
      //      JS-readable cookie set by saveAuth()
      //   5. calls saveAuth(token, user), which normalizes
      //      user.role / user.permissions before persisting
      await loginUser(identity, password);

      router.replace("/dashboard");
      return true;
    } catch (err) {
      // 2. Try known fixed backend codes first (Password_Incorrect, User_Not_Found, etc.).
      const normalized = translateError(err);
      if (normalized.kind === "known_message") {
        setError(normalized.message);
        return false;
      }

      // 3. Keep existing network/401/blocked-role handling for non-fixed-code errors.
      const message =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع. يرجى المحاولة لاحقًا.";
      const lower = message.toLowerCase();

      if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
        setError("تعذر الاتصال بالخادم. يرجى التحقق من الاتصال والمحاولة مرة أخرى.");
      } else if (lower.includes("401") || lower.includes("unauthorized")) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
      } else if (message.includes("غير مصرح لك بالوصول")) {
        // 4. Preserve loginUser()'s own blocked-role message verbatim.
        setError(message);
      } else {
        // 5. Clean fallback instead of showing raw backend text.
        setError(normalized.message);
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { login, loading, error, clearError };
}