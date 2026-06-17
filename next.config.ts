// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No rewrites needed. All proxying is handled by
  // app/api/proxy/[...path]/route.ts, which reads the HttpOnly auth cookie
  // server-side and forwards it as a Bearer token to the backend.
};

export default nextConfig;