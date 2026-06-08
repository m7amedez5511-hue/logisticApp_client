"use client";

export default function ClientHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="flex min-h-screen">
        <aside className="hidden w-18 border-r border-slate-200 bg-white lg:flex lg:flex-col lg:items-center lg:py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">🚚</div>
          <nav className="mt-6 flex flex-1 flex-col items-center gap-3 text-[9px] font-semibold text-slate-400">
            {['Home','New Order','Track','History','Settings'].map((label, index) => (
              <button key={label} type="button" className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl ${index === 0 ? 'bg-blue-50 text-blue-600' : 'bg-transparent hover:bg-slate-100'}`}>
                <span className="text-base">•</span>
                <span>{['الرئيسية','طلب جديد','تتبع','السجل','الإعدادات'][index]}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 p-6 lg:p-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.35em] text-blue-600">الصفحة الرئيسية للعميل</p>
              <h1 className="mt-2 text-[24px] font-bold text-slate-900">صباح الخير يا عميل 👋</h1>
              <p className="text-[13px] text-slate-500">نظرة عامة على عمليات الإرسال والنشاط الأخير للطلبات.</p>
            </div>
            <button className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">+ طلب جديد</button>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['الطلبات النشطة', '12', 'text-blue-600'],
              ['المسلمة هذا الشهر', '86', 'text-emerald-600'],
              ['العناوين المحفوظة', '4', 'text-slate-900'],
            ].map(([label, value, tone]) => (
              <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{label}</p>
                <p className={`mt-3 text-[26px] font-bold ${tone}`}>{value}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-[16px] font-semibold">الطلب النشط</h2>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">ORD-202606-00142</p>
                    <p className="text-[12px] text-slate-500">المركز الشمالي → مخزن وسط المدينة</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">في الطريق</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-2/3 rounded-full bg-blue-600" />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-[16px] font-semibold">الطلبات الأخيرة</h2>
              <ul className="mt-4 divide-y divide-slate-200">
                {[
                  ['ORD-202606-00110', 'تم التوصيل', 'تم التوصيل', 'green'],
                  ['ORD-202606-00115', 'ملغى', 'ملغى', 'red'],
                ].map(([ref, status, note, tone]) => (
                  <li key={ref} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{ref}</p>
                      <p className="text-[12px] text-slate-500">{note}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${tone === 'green' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{status}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
