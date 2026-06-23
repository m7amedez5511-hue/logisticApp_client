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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
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