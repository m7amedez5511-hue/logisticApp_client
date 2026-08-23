"use client";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";

export default function ProfilePage() {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
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
    { label: "تاريخ الإنشاء", value: new Date(user.createdAt).toLocaleDateString("ar-SA") },
    { label: "آخر تحديث", value: new Date(user.updatedAt).toLocaleDateString("ar-SA") },
  ];

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
  const totalPermissions = Object.values(permissionsByModule).reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* top bar: user info */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white">
            {user.name?.trim().charAt(0) ?? "?"}
          </div>
          <div className="flex-1 text-center sm:text-right">
            <h1 className="text-lg font-semibold text-slate-900">{user.name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{user.email ?? user.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role?.name && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {user.role.name}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {user.isActive ? "نشط" : "غير نشط"}
            </span>
          </div>
        </div>
      </div>

      {/* main content, full width */}
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* account details */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-1">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">بيانات الحساب</h2>
            <dl className="divide-y divide-slate-100">
              {fields.map((f) => (
                <div key={f.label} className="flex items-center justify-between py-2.5 text-[13px]">
                  <dt className="text-slate-500">{f.label}</dt>
                  <dd className="font-medium text-slate-800">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* role and permissions */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">الدور والصلاحيات</h2>
                {user.role?.description && (
                  <p className="mt-1 text-[13px] text-slate-500">{user.role.description}</p>
                )}
              </div>
              {modules.length > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                  {totalPermissions} صلاحية
                </span>
              )}
            </div>

            {modules.length === 0 ? (
              <p className="text-[13px] text-slate-400">لا توجد صلاحيات مسجّلة لهذا الدور.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {modules.map((mod) => (
                  <div key={mod} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[13px] font-medium text-slate-700">{mod}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-normal text-slate-500 ring-1 ring-slate-100">
                        {permissionsByModule[mod].length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {permissionsByModule[mod].map((name) => (
                        <span
                          key={name}
                          className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}