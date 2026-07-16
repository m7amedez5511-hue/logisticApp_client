// app/components/layout/ConditionalNavbar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useStoredUser } from "@/src/hooks/useStoredUser";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // استبدلنا getStoredUser() المباشر بالـ hook عشان يبقى SSR-safe
  const { user, loading } = useStoredUser();

  // لحد ما نتأكد من حالة تسجيل الدخول من الـ storage، منوريش/مخفيش
  // الناف بار عشان نتجنب وميض (flash) قبل الـ hydration يخلص. مفيش
  // حاجة تتعرض هنا أصلاً (مفيش avatar/اسم في الناف بار العام)، فـ null
  // كافية ومفيش داعي لـ Spinner/InlineLoader في المكان ده.
  if (loading) return null;

  // لو المستخدم مسجل دخول، أو الصفحة الحالية جوه الداشبورد، منظهرش الناف بار العام
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  if (user || isDashboardRoute) return null;

  return <Navbar />;
}