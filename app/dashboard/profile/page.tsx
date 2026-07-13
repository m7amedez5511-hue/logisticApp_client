"use client";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";

export default function ProfilePage() {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
    // حالة تحميل بسيطة تتماشى مع سبينر الصور اللي عملتها قبل كده في الصفحات التانية
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        {error ?? "تعذر عرض بيانات الحساب."}
      </div>
    );
  }

  const fields: { label: string; value: string }[] = [
    { label: "الاسم", value: user.name },
    { label: "اسم المستخدم", value: user.userName ?? "—" },
    { label: "البريد الإلكتروني", value: user.email ?? "—" },
    { label: "رقم الهاتف", value: user.phone },
    { label: "الحالة", value: user.isActive ? "نشط" : "غير نشط" },
    { label: "تاريخ الإنشاء", value: new Date(user.createdAt).toLocaleDateString("ar-SA") },
    { label: "آخر تحديث", value: new Date(user.updatedAt).toLocaleDateString("ar-SA") },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-10" dir="rtl">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src={user.photo ?? "/images/avatar-placeholder.png"}
            alt={user.name}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-blue-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/avatar-placeholder.png";
            }}
          />
          <h1 className="text-base font-semibold text-slate-900">{user.name}</h1>
        </div>

        {/* عرض البيانات بشكل read-only بدون أي فورم أو زرار تعديل */}
        <dl className="divide-y divide-slate-100">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-slate-500">{f.label}</dt>
              <dd className="font-medium text-slate-800">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}