"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", company: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[0-9]{10,15}$/;

  function validateStep1() {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "This field is required.";
    if (!form.email.trim()) nextErrors.email = "This field is required.";
    else if (!emailPattern.test(form.email)) nextErrors.email = "Please enter a valid email address (e.g. name@domain.com).";
    if (!form.phone.trim()) nextErrors.phone = "This field is required.";
    else if (!phonePattern.test(form.phone)) nextErrors.phone = "Phone number must be 10–15 digits, with optional country code.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (validateStep1()) setStep(2);
  }

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/client";
    }, 600);
  }

  const progressSteps: Array<[number, string, boolean]> = [
    [1, "بياناتك", step >= 1],
    [2, "التفضيلات", step >= 2],
    [3, "التأكيد", step >= 3],
  ];

  const summaryRows = useMemo(
    () => [
      ["Full Name", form.fullName || "—"],
      ["Email", form.email || "—"],
      ["Phone", form.phone || "—"],
      ["Company", form.company || "—"],
      ["Address", form.address || "—"],
    ],
    [form],
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-[0.35em] text-blue-600">تسجيل العميل</p>
            <h1 className="mt-2 text-[28px] font-bold text-slate-900">إنشاء حساب LogiFlow</h1>
          </div>
          <Link href="/login" className="rounded-[9px] border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 hover:bg-slate-100">العودة لتسجيل الدخول</Link>
        </header>

        <div className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm">
          {progressSteps.map(([index, label, done]) => (
            <div key={String(index)} className="flex flex-1 items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-bold ${step === index ? "border-blue-600 bg-blue-50 text-blue-600" : done ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
                {index}
              </div>
              <span className={`text-[12px] font-semibold ${step === index ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-500"}`}>{label}</span>
              {index < 3 ? <span className="hidden h-px flex-1 bg-slate-200 md:block" /> : null}
            </div>
          ))}
        </div>

        <article className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-[18px] font-semibold">المعلومات الشخصية</h2>
                <p className="text-[13px] text-slate-500">أكمل الحقول المطلوبة للانتقال إلى خطوة التأكيد.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-[12px] font-semibold uppercase tracking-[0.5px] text-slate-500">الاسم الكامل
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-2 h-11 w-full rounded-[9px] border border-slate-200 px-3 text-[14px] text-slate-900" />
                  {errors.fullName ? <span className="mt-1 block text-[12px] text-red-600">{errors.fullName}</span> : null}
                </label>
                <label className="text-[12px] font-semibold uppercase tracking-[0.5px] text-slate-500">البريد الإلكتروني
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 h-11 w-full rounded-[9px] border border-slate-200 px-3 text-[14px] text-slate-900" />
                  {errors.email ? <span className="mt-1 block text-[12px] text-red-600">{errors.email}</span> : null}
                </label>
                <label className="text-[12px] font-semibold uppercase tracking-[0.5px] text-slate-500">رقم الهاتف
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 h-11 w-full rounded-[9px] border border-slate-200 px-3 text-[14px] text-slate-900" />
                  {errors.phone ? <span className="mt-1 block text-[12px] text-red-600">{errors.phone}</span> : null}
                </label>
                <label className="text-[12px] font-semibold uppercase tracking-[0.5px] text-slate-500">اسم الشركة
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-2 h-11 w-full rounded-[9px] border border-slate-200 px-3 text-[14px] text-slate-900" />
                </label>
              </div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.5px] text-slate-500">العنوان
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={4} className="mt-2 w-full rounded-[9px] border border-slate-200 px-3 py-2 text-[14px] text-slate-900" />
              </label>
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex h-10 flex-1 items-center justify-center rounded-[9px] border border-slate-200 bg-white text-sm font-semibold text-slate-500">رجوع</Link>
                <button type="button" onClick={handleNext} className="flex h-10 flex-2 items-center justify-center rounded-[9px] bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">التالي</button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-[18px] font-semibold">التفضيلات</h2>
                <p className="text-[13px] text-slate-500">راجع التفاصيل الاختيارية وانتقل إلى المراجعة.</p>
              </div>
              <div className="rounded-[10px] border border-slate-200 bg-slate-100 p-4 text-sm text-slate-500">سيتم إنشاء الحساب بشكل آمن. يتم تشفير البيانات الحساسة أثناء التخزين.</div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex h-10 flex-1 items-center justify-center rounded-[9px] border border-slate-200 bg-white text-sm font-semibold text-slate-500">رجوع</button>
                <button type="button" onClick={() => setStep(3)} className="flex h-10 flex-2 items-center justify-center rounded-[9px] bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">مراجعة</button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-[18px] font-semibold">تأكيد وإرسال</h2>
                <p className="text-[13px] text-slate-500">راجع بياناتك قبل إنشاء الحساب.</p>
              </div>
              <table className="w-full overflow-hidden rounded-[10px] border border-slate-200 text-left text-sm">
                <tbody>{summaryRows.map(([label, value]) => <tr key={label} className="border-b border-slate-200 last:border-b-0"><td className="bg-slate-100 px-4 py-3 font-semibold text-slate-500">{label}</td><td className="px-4 py-3 text-slate-900">{value}</td></tr>)}</tbody>
              </table>
              <div className="rounded-[10px] border border-blue-200 bg-blue-50 p-3 text-sm text-slate-900">سيتم إنشاء الحساب بشكل آمن. يتم تشفير البيانات الحساسة أثناء التخزين.</div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="flex h-10 flex-1 items-center justify-center rounded-[9px] border border-slate-200 bg-white text-sm font-semibold text-slate-500">رجوع</button>
                <button type="button" disabled={loading} onClick={handleSubmit} className="flex h-10 flex-2 items-center justify-center rounded-[9px] bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70">{loading ? "جاري إنشاء الحساب…" : "إنشاء حسابي"}</button>
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
