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

  // تجميع الصلاحيات حسب الموديول عشان تبقى منظمة وسهلة القراءة
  const permissionsByModule = (user.role?.permissions ?? []).reduce<Record<string, string[]>>(
    (acc, entry) => {
      const mod = entry.permission.module || "أخرى";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(entry.permission.name);
      return acc;
    },
    {},
  );
  const modules = Object.keys(permissionsByModule);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10" dir="rtl">
      {/* بطاقة البيانات الأساسية */}
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-blue-600 ring-2 ring-blue-100">
            {user.name?.trim().charAt(0) ?? "?"}
          </div>
          <h1 className="text-base font-semibold text-slate-900">{user.name}</h1>
          {user.role?.name && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {user.role.name}
            </span>
          )}
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

      {/* بطاقة الدور والصلاحيات */}
      {user.role && (
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">الدور والصلاحيات</h2>
            {user.role.description && (
              <p className="mt-1 text-[13px] text-slate-500">{user.role.description}</p>
            )}
          </div>

          {modules.length === 0 ? (
            <p className="text-[13px] text-slate-400">لا توجد صلاحيات مسجّلة لهذا الدور.</p>
          ) : (
            <div className="space-y-2">
              {modules.map((mod) => (
                <details
                  key={mod}
                  className="group rounded-lg border border-slate-100 open:bg-slate-50"
                  open
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[13px] font-medium text-slate-700">
                    <span className="flex items-center gap-2">
                      {mod}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-500">
                        {permissionsByModule[mod].length}
                      </span>
                    </span>
                    <span className="text-slate-400 transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
                    {permissionsByModule[mod].map((name) => (
                      <span
                        key={name}
                        className="rounded-md bg-blue-50 px-2.5 py-1 text-[12px] font-medium text-blue-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}