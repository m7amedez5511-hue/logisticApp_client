import type { Metadata } from "next";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import "./globals.css";
import ConditionalNavbar from "./components/layout/ConditionalNavbar";

import { Footer } from "./components/layout";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  description: "نظام إدارة الأسطول والعمليات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ⚠️ اتصلح: الـ Navbar والـ footer كانوا برة <html>/<body> وده HTML غير صالح
    <html lang="ar" dir="rtl">
      <body className="app-shell">
        {/* الناف بار بيظهر بس لو مفيش يوزر مسجل دخول */}
        <ConditionalNavbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}