import type { Metadata } from "next";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import "./globals.css";

/**
 * NOT SHOWN IN THE ORIGINAL FILE SET.
 * This is the one file every RTL conversion ultimately hinges on:
 * `dir="rtl"` and `lang="ar"` belong on the root <html> element so
 * (a) the browser's native bidi algorithm kicks in everywhere,
 * (b) Tailwind v4's `rtl:`/`ltr:` variants have something to key off,
 * (c) form controls, scrollbars, and native widgets mirror correctly.
 *
 * If your real app/layout.tsx differs (providers, fonts, etc.), keep
 * everything else as-is and only add the import below.
 *
 * ICON FONT: the project already uses Tabler Icons class names
 * everywhere (ti ti-layout-dashboard, ti ti-car, ti ti-route, ...)
 * but no stylesheet that defines those classes was ever loaded, so
 * every icon in the sidebar was silently rendering as nothing.
 * Self-hosted via `npm install @tabler/icons-webfont` rather than a
 * CDN <link> — no external request at runtime, works behind
 * corporate proxies / restrictive network policies, and Next bundles
 * + fingerprints the CSS and font files automatically. Run
 * `npm install @tabler/icons-webfont` if it isn't already a
 * dependency, then this import resolves on its own.
 */

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
      <body className="app-shell">{children}</body>
    </html>
  );
}