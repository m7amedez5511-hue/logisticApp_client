import Link from "next/link";
import { UserPlus, Building2, PackagePlus, LineChart } from "lucide-react";
import Navbar from "@/app/components/layout/Navbar";
import Logo from "@/src/utils/logo";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "أنشئ حسابك",
    text: "سجّل بيانات شركتك وأضف أول مستخدم مشرف على المنصة في دقائق.",
  },
  {
    icon: Building2,
    step: "02",
    title: "جهّز أسطولك",
    text: "أضف الفروع والمركبات والسائقين، مع كل بياناتهم ومستنداتهم الرسمية.",
  },
  {
    icon: PackagePlus,
    step: "03",
    title: "أنشئ الطلبات والرحلات",
    text: "اربط كل طلب برحلة وسائق ومركبة، وتابع حالته حتى وصوله للعميل.",
  },
  {
    icon: LineChart,
    step: "04",
    title: "راقب وحلّل",
    text: "استخدم لوحة التحكم والتقارير لمتابعة الأداء واتخاذ قرارات أفضل.",
  },
];

export default function HowWorkPage() {
  return (
    <main className="min-h-screen bg-[#ECEEF2] text-slate-900" dir="rtl">
      

      <section className="bg-[linear-gradient(145deg,#0D47A1_0%,#1A73E8_45%,#1565C0_100%)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
            كيف تعمل المنصة
          </p>
          <h1 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-tight lg:text-[36px]">
            أربع خطوات فقط لإدارة أسطولك بالكامل
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/75">
            صممنا رحلة الإعداد لتكون بسيطة وسريعة، بحيث يبدأ فريقك العمل من
            اليوم الأول.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
        <div className="relative flex flex-col gap-8">
          <div
            aria-hidden="true"
            className="absolute right-[27px] top-4 hidden h-[calc(100%-2rem)] w-px bg-slate-200 md:block"
          />
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.step} className="relative flex gap-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-600">
                    خطوة {step.step}
                  </span>
                  <h3 className="mt-2 text-[17px] font-extrabold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500">
                    {step.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h2 className="text-[20px] font-extrabold text-slate-900">
            جاهز تبدأ؟
          </h2>
          <p className="max-w-xl text-[14px] text-slate-500">
            سجّل الدخول الآن وابدأ في تنظيم أسطولك من لوحة تحكم واحدة.
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl bg-blue-600 px-6 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            تسجيل الدخول للوحة التحكم
          </Link>
        </div>
      </section>

      
    </main>
  );
}