import Link from "next/link";

export default function NotFound() {
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
        {/* Large 404 */}
        <p style={{
          fontSize: "6rem",
          fontWeight: 800,
          color: "var(--color-brand-600)",
          lineHeight: 1,
          margin: 0,
          fontFamily: "var(--font-mono)",
        }}>
          404
        </p>

        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginTop: "1rem",
        }}>
          الصفحة غير موجودة
        </h1>

        <p style={{
          fontSize: 14,
          color: "var(--color-text-muted)",
          marginTop: "0.75rem",
          lineHeight: 1.7,
        }}>
          الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها أو حذفها.
        </p>

        <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard"
            style={{
              height: 40, padding: "0 1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "none", background: "var(--color-brand-600)",
              fontSize: 13, fontWeight: 700, color: "#FFF",
              textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
            <i className="ti ti-home" style={{ fontSize: 14 }} aria-hidden="true" />
            لوحة التحكم
          </Link>

          <Link href="/"
            style={{
              height: 40, padding: "0 1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: 13, fontWeight: 600,
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              display: "inline-flex", alignItems: "center",
            }}>
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}