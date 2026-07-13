"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";


const faqs = [
  {
    q: "كيف أنشئ حساب عميل؟",
    a: "اضغط على زر تسجيل الدخول ثم اختر إنشاء حساب جديد، وأكمل بياناتك الأساسية لتفعيل الحساب في دقائق.",
  },
  {
    q: "هل يمكنني إدارة أكثر من فرع؟",
    a: "نعم، تدعم المنصة إدارة عدد غير محدود من الفروع في خطتي الاحترافي والمؤسسات، مع ربط كل فرع بعناوينه ومركباته.",
  },
  {
    q: "ماذا يحدث إن أدخلت كلمة مرور خاطئة؟",
    a: "ستظهر لك رسالة خطأ واضحة مع خيار إعادة المحاولة أو استرجاع كلمة المرور.",
  },
  {
    q: "هل بياناتي الشخصية محمية؟",
    a: "نعم، يتم تشفير البيانات باستخدام معايير أمان متقدمة، مع صلاحيات دقيقة تحدد من يستطيع الوصول لكل بيانات.",
  },
  {
    q: "هل يمكن للعميل رؤية طلبات عملاء آخرين؟",
    a: "لا، كل عميل يرى فقط طلباته الخاصة ضمن لوحة التحكم المخصصة له.",
  },
  {
    q: "هل تدعم المنصة تنبيهات انتهاء تراخيص المركبات والسائقين؟",
    a: "نعم، تصل التنبيهات قبل 90 يومًا من انتهاء الاستمارة أو رخصة القيادة أو أي مستند رسمي آخر.",
  },
  {
    q: "كيف أتواصل مع الدعم الفني؟",
    a: "يمكنك التواصل معنا عبر البريد الإلكتروني أو من خلال صفحة الأسعار لطلب التحدث مع فريق المبيعات لخطة المؤسسات.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#ECEEF2] text-slate-900" dir="rtl">
     

      <section className="bg-[linear-gradient(145deg,#0D47A1_0%,#1A73E8_45%,#1565C0_100%)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
            الأسئلة الشائعة
          </p>
          <h1 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-tight lg:text-[36px]">
            إجابات على أكثر الأسئلة تكرارًا
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/75">
            لم تجد إجابة سؤالك؟ تواصل معنا وسنكون سعداء بمساعدتك.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right"
                >
                  <span className="text-[14px] font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-[13px] leading-6 text-slate-500">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h2 className="text-[18px] font-extrabold text-slate-900">
            عندك سؤال تاني؟
          </h2>
          <Link
            href="/prices"
            className="inline-flex h-11 items-center rounded-xl bg-blue-600 px-6 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            تواصل معنا
          </Link>
        </div>
      </section>

      
    </main>
  );
}