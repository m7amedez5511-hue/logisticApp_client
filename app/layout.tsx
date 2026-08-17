import type { Metadata } from "next";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import "./globals.css";
import ConditionalNavbar from "./components/layout/ConditionalNavbar";
import { ExtensionAttributeCleanup } from "./components/system/ExtensionAttributeCleanup"; // CHANGE: added — fixes hydration mismatch caused by browser extensions

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
      <body className="app-shell" suppressHydrationWarning>
        {/* CHANGE: mounted globally so every route (not just the dashboard
            form pages) gets protected from extension-injected attributes */}
        <ExtensionAttributeCleanup />
        {/* الناف بار بيظهر بس لو مفيش يوزر مسجل دخول */}
        <ConditionalNavbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}