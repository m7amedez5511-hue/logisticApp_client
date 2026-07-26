// app/components/layout/ConditionalNavbar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useStoredUser } from "@/src/hooks/useStoredUser";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  const { user, loading } = useStoredUser();

 
  if (loading) return null;

  const isDashboardRoute = pathname?.startsWith("/dashboard");
  if (user || isDashboardRoute) return null;

  return <Navbar />;
}