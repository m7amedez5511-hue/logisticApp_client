"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, Input } from "@/src/Components/UI";
import { useAuth } from "@/src/hooks/useAuth";
import Logo from "@/src/utils/logo";
import { loginSchema, type LoginFormData } from "@/src/validations/auth.validator";

export function LoginForm() {
  const { login, loading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginFormData) => {
    await login(values.identity, values.password);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}>
      <section style={{ minHeight: "100vh", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <aside style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0f172a 0%, #2563EB 50%, #3b82f6 100%)", color: "#FFF", padding: "2.5rem 3rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.28, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            <div>
              <Logo white={true} />
              <h1 style={{ marginTop: "2.5rem", maxWidth: "28rem", fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                اللوجستيات ببساطة، والتسليم بثقة.
              </h1>
              <p style={{ marginTop: "1rem", maxWidth: "28rem", fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(255,255,255,0.75)" }}>
                راقب عمليات التسليم، وقم بتنظيم السائقين، وحافظ على رؤية كل طلب من خلال تسجيل دخول آمن واحد.
              </p>
              <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  ["التنسيق اللحظي", "تتبع كل طلب من الاستلام إلى التسليم في مكان واحد."],
                  ["وصول آمن", "الجلسات المعتمدة على الصلاحيات تبقي مسارات العميل والإدارة منفصلة."],
                  ["عمليات سريعة", "استخدم لوحة الإدارة لمراجعة الحالة والتنبيهات وحركة الرحلات."],
                ].map(([title, desc]) => (
                  <article key={title} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.1)", padding: "0.85rem" }}>
                    <div aria-hidden="true" style={{ marginTop: "0.125rem", flexShrink: 0, width: "2.25rem", height: "2.25rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem" }}>
                      •
                    </div>
                    <div>
                      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>{title}</h2>
                      <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.8)" }}>{desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>مصمم لفرق العمليات التي تحتاج إلى الوضوح والسرعة والثقة.</p>
          </div>
        </aside>

        <section style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface)", padding: "2.5rem 1.5rem" }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%", maxWidth: "26rem", borderRadius: "0.9rem", border: "1px solid var(--color-border)", background: "#FFF", padding: "2rem", boxShadow: "var(--shadow-card)" }} noValidate>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>مرحبًا بعودتك</p>
            <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>سجل الدخول لإدارة عمليات التسليم</p>

            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
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

            <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
              <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "var(--color-brand-600)", textDecoration: "none" }}>
                هل نسيت كلمة المرور؟
              </Link>
            </div>

            {error && (
              <div style={{ marginTop: "1rem" }}>
                <Alert type="error" message={error} onClose={clearError} />
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-6 h-11">
              {loading ? "جاري تسجيل الدخول…" : "تسجيل الدخول"}
            </Button>

            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              ليس لديك حساب؟{" "}
              <Link href="/register" style={{ color: "var(--color-brand-600)", textDecoration: "none" }}>
                إنشاء حساب
              </Link>
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}
