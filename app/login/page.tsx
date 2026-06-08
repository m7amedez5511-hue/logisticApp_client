"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../src/lib/auth";
import Logo from "@/src/utils/logo";

export default function LoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(identity, password);

      window.location.href = "/dashboard"; // Use full page reload to ensure all client state is reset after login
    } catch (err) {
      // FIX: Surface specific error messages from auth.ts (invalid credentials,
      // role denial, network failure) directly to the user.
      if (err instanceof Error) {
        // Network/fetch failure signals
        if (
          err.message.includes("fetch") ||
          err.message.includes("network") ||
          err.message.includes("Failed to fetch")
        ) {
          setError(
            "Unable to connect. Please check your internet connection and try again later.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("System temporarily unavailable. Please try later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="grid min-h-screen w-full lg:grid-cols-[1fr_1fr]">
        <aside className="relative overflow-hidden bg-linear-to-br from-blue-900 via-blue-600 to-blue-700 px-8 py-10 text-white lg:px-12 lg:py-14">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Logo />
              <h1 className="mt-10 max-w-md text-[36px] font-bold leading-tight tracking-[-0.5px]">
                اللوجستيات ببساطة، والتسليم بثقة.
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">
                راقب عمليات التسليم، وقم بتنظيم السائقين، وحافظ على رؤية كل طلب
                من خلال تسجيل دخول آمن واحد.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  [
                    "التنسيق اللحظي",
                    "تتبع كل طلب من الاستلام إلى التسليم في مكان واحد.",
                  ],
                  [
                    "وصول آمن",
                    "الجلسات المعتمدة على الصلاحيات تبقي مسارات العميل والإدارة منفصلة.",
                  ],
                  [
                    "عمليات سريعة",
                    "استخدم لوحة الإدارة لمراجعة الحالة والتنبيهات وحركة الرحلات.",
                  ],
                ].map(([title, desc]) => (
                  <article
                    key={title}
                    className="flex items-start gap-3 rounded-[10px] border border-white/15 bg-white/10 p-3"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm">
                      •
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold">{title}</h2>
                      <p className="text-xs text-white/80">{desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <p className="text-[12px] text-white/50">
              مصمم لفرق العمليات التي تحتاج إلى الوضوح والسرعة والثقة.
            </p>
          </div>
        </aside>

        <section className="flex items-center justify-center bg-slate-50 px-6 py-10 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-100 rounded-[14px] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <p className="text-[28px] font-bold text-slate-900">
              مرحبًا بعودتك
            </p>
            <p className="mt-1 text-[14px] text-slate-500">
              سجل الدخول لإدارة عمليات التسليم
            </p>

            <label className="mt-6 block text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500">
              البريد الإلكتروني أو رقم الهاتف أو اسم المستخدم
              <input
                autoComplete="username"
                className="mt-2 h-11 w-full rounded-[9px] border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                placeholder="name@company.com / 05xxxxxxxx / username"
                required
              />
            </label>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-[0.5px] text-slate-500">
              كلمة المرور
              <input
                type="password"
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-[9px] border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <div className="mt-3 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-[12px] text-blue-600 hover:underline"
              >
                هل نسيت كلمة المرور؟
              </Link>
            </div>

            {error ? (
              <p className="mt-4 rounded-[9px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-11.5 w-full items-center justify-center rounded-[9px] bg-blue-600 text-[15px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "جاري تسجيل الدخول…" : "تسجيل الدخول"}
            </button>

            <p className="mt-4 text-center text-[13px] text-slate-500">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                إنشاء حساب
              </Link>
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}
