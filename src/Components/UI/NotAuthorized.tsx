
"use client";
import Link from "next/link";
import { Button } from "./Button";

export function NotAuthorized() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "1rem", padding: "4rem 1rem", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "#FEF2F2",
        border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <i className="ti ti-lock" style={{ fontSize: 28, color: "#DC2626" }} aria-hidden="true" />
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
        غير مصرح لك بالوصول
      </h1>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", maxWidth: 380 }}>
        ليست لديك الصلاحية اللازمة لعرض هذا القسم. تواصل مع مسؤول النظام إذا كنت تعتقد أن هذا خطأ.
      </p>
      <Link href="/dashboard">
        <Button variant="primary">العودة إلى لوحة التحكم</Button>
      </Link>
    </div>
  );
}