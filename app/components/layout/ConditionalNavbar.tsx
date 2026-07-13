"use client";

import { usePathname } from "next/navigation";
import { getStoredUser } from "@/src/lib/auth";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const user = getStoredUser();

  // لو المستخدم مسجل دخول، أو الصفحة الحالية جوه الداشبورد، منظهرش الناف بار العام
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  if (user || isDashboardRoute) return null;

  return <Navbar />;
}