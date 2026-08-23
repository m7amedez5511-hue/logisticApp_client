import type { Metadata } from "next";
import Script from "next/script";
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
    
    <html lang="ar" dir="rtl">
      <body className="app-shell" suppressHydrationWarning>
        {/* CHANGE: added — fixes hydration mismatch caused by browser extensions */}
        <ExtensionAttributeCleanup />
        {/* CHANGE: navbar is conditional based on route, so we can hide it on login/register pages */}
        <ConditionalNavbar />
        {children}
        <Footer />
        <Script
          id="extension-attribute-pre-hydration-cleanup"
          strategy="beforeInteractive"
        >
          {`(() => {
              const attrs = ["bis_skin_checked", "bis_register", "__processed_by_bitdefender__"];
              const selector = attrs.map((attr) => "[" + attr + "]").join(",");

              function strip() {
                document.querySelectorAll(selector).forEach((element) => {
                  attrs.forEach((attr) => element.removeAttribute(attr));
                });
              }

              strip();
              new MutationObserver(strip).observe(document, {
                attributes: true,
                childList: true,
                subtree: true,
                attributeFilter: attrs,
              });
            })();`}
        </Script>
      </body>
    </html>
  );
}