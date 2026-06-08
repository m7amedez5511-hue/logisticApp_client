// ─────────────────────────────────────────────
// next.config.ts
// Proxy للـ API عشان نتفادى CORS في المتصفح
// ─────────────────────────────────────────────
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // كل طلب لـ /api/proxy/... يتحول لـ logiapi.slash.sa/api/v1/...
        source:      "/api/proxy/:path*",
        destination: "https://logiapi.slash.sa/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;