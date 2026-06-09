// app/layout.tsx
// Root layout — single location for font loading and global metadata.
// No inline styles, no @import in CSS.

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Slash.sa — Logistics Management",
    template: "%s | Slash.sa",
  },
  description:
    "Modern logistics client portal — manage deliveries, drivers, and fleet operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // dir is set per route-group (ar = RTL, en = LTR) not globally
    <html
      lang="ar"
      className={`${jakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}