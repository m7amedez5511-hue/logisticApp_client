import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "var(--color-surface-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{
          width: 80, height: 80, margin: "0 auto",
          borderRadius: "50%", background: "#FEF2F2",
          border: "2px solid #FECACA",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ti ti-shield-exclamation" style={{ fontSize: 36, color: "#DC2626" }} aria-hidden="true" />
        </div>

        <p style={{
          fontSize: "3rem", fontWeight: 800,
          color: "#DC2626", lineHeight: 1,
          margin: "1rem 0 0", fontFamily: "var(--font-mono)",
        }}>403</p>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "0.75rem" }}>
          غير مصرح بالوصول
        </h1>

        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: "0.75rem", lineHeight: 1.7 }}>
          ليس لديك الصلاحية للوصول إلى هذه الصفحة. إذا كنت تعتقد أن هذا خطأ، تواصل مع مسؤول النظام.
        </p>

        <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Link href="/login"
            style={{
              height: 40, padding: "0 1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "none", background: "var(--color-brand-600)",
              fontSize: 13, fontWeight: 700, color: "#FFF",
              textDecoration: "none",
              display: "inline-flex", alignItems: "center",
            }}>
            تسجيل الدخول بحساب آخر
          </Link>
        </div>
      </div>
    </main>
  );
}