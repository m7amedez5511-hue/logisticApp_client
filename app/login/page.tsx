"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginUser } from "@/src/lib/auth";
import { loginSchema, LoginFormData } from "@/src/validations/auth.validator";
import Logo from "@/src/utils/logo";
import { Button } from "@/src/Components/UI";
import { Input }  from "@/src/Components/UI";
import { Alert }  from "@/src/Components/UI";

export default function LoginPage() {
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);
    setLoading(true);

    try {
      await loginUser(data.identity, data.password);
      console.log("Login successful", { identity: data.identity });
      window.location.href = "/dashboard";
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
          setError("Unable to connect. Please check your internet connection and try again later.");
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

        {/* ── Left panel ─────────────────────────────────── */}
        <aside className="relative overflow-hidden bg-linear-to-br from-blue-900 via-blue-600 to-blue-700 px-8 py-10 text-white lg:px-12 lg:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Logo white={true} />
              <h1 className="mt-10 max-w-md text-[36px] font-bold leading-tight tracking-[-0.5px]">
                اللوجستيات ببساطة، والتسليم بثقة.
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">
                راقب عمليات التسليم، وقم بتنظيم السائقين، وحافظ على رؤية كل طلب من خلال تسجيل دخول آمن واحد.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  ["التنسيق اللحظي",  "تتبع كل طلب من الاستلام إلى التسليم في مكان واحد."],
                  ["وصول آمن",         "الجلسات المعتمدة على الصلاحيات تبقي مسارات العميل والإدارة منفصلة."],
                  ["عمليات سريعة",    "استخدم لوحة الإدارة لمراجعة الحالة والتنبيهات وحركة الرحلات."],
                ].map(([title, desc]) => (
                  <article
                    key={title}
                    className="flex items-start gap-3 rounded-[10px] border border-white/15 bg-white/10 p-3"
                  >
                    <div aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm">
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
            <p className="text-[12px] text-white/50">مصمم لفرق العمليات التي تحتاج إلى الوضوح والسرعة والثقة.</p>
          </div>
        </aside>

        {/* ── Right panel ────────────────────────────────── */}
        <section className="flex items-center justify-center bg-slate-50 px-6 py-10 lg:px-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-[400px] rounded-[14px] border border-slate-200 bg-white p-8 shadow-sm"
            noValidate
          >
            <p className="text-[28px] font-bold text-slate-900">مرحبًا بعودتك</p>
            <p className="mt-1 text-[14px] text-slate-500">سجل الدخول لإدارة عمليات التسليم</p>

            <div className="mt-6 flex flex-col gap-4">
              <Input
                label="البريد الإلكتروني أو رقم الهاتف أو اسم المستخدم"
                autoComplete="username"
                placeholder="name@company.com / 05xxxxxxxx / username"
                error={errors.identity?.message}
                {...register("identity")}
              />

              <Input
                label="كلمة المرور"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <Link href="/forgot-password" className="text-[12px] text-blue-600 hover:underline">
                هل نسيت كلمة المرور؟
              </Link>
            </div>

            {error && (
              <div className="mt-4">
                <Alert type="error" message={error} onClose={() => setError(null)} />
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="mt-6 h-11"
            >
              {loading ? "جاري تسجيل الدخول…" : "تسجيل الدخول"}
            </Button>

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