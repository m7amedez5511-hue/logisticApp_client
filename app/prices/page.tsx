import Link from "next/link";
import { Check } from "lucide-react";
import Navbar from "@/app/components/layout/Navbar";
import Logo from "@/src/utils/logo";

const plans = [
  {
    name: "أساسي",
    price: "499",
    period: "شهريًا",
    description: "مناسبة للفرق الصغيرة التي تبدأ في تنظيم أسطولها.",
    features: [
      "حتى 10 مركبات",
      "حتى 15 سائقًا",
      "إدارة الطلبات والرحلات",
      "دعم عبر البريد الإلكتروني",
    ],
    highlighted: false,
  },
  {
    name: "احترافي",
    price: "1,299",
    period: "شهريًا",
    description: "الأنسب للشركات متوسطة الحجم مع عدة فروع.",
    features: [
      "حتى 50 مركبة",
      "عدد غير محدود من السائقين",
      "إدارة الفروع والصلاحيات",
      "تقارير وتحليلات متقدمة",
      "دعم فني مباشر",
    ],
    highlighted: true,
  },
  {
    name: "مؤسسات",
    price: "تواصل معنا",
    period: "",
    description: "حلول مخصصة للمؤسسات الكبيرة وأصحاب الأساطيل الضخمة.",
    features: [
      "عدد غير محدود من المركبات والفروع",
      "تكاملات مخصصة",
      "مدير حساب مخصص",
      "اتفاقية مستوى خدمة (SLA)",
    ],
    highlighted: false,
  },
];

export default function PricesPage() {
  return (
    <main className="min-h-screen bg-[#ECEEF2] text-slate-900" dir="rtl">
     

      <section className="bg-[linear-gradient(145deg,#0D47A1_0%,#1A73E8_45%,#1565C0_100%)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
            الأسعار
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl text-[30px] font-extrabold leading-tight lg:text-[36px]">
            خطط تناسب حجم أسطولك
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-white/75">
            جميع الأسعار بالريال السعودي وغير شاملة ضريبة القيمة المضافة. يمكنك
            تغيير خطتك أو إلغاؤها في أي وقت.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col rounded-3xl border p-7 shadow-sm ${
                plan.highlighted
                  ? "border-blue-600 bg-white ring-2 ring-blue-600"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-flex w-fit rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                  الأكثر طلبًا
                </span>
              )}
              <h3 className="text-[18px] font-extrabold text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-500">
                {plan.description}
              </p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-[32px] font-extrabold text-slate-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="pb-1.5 text-[13px] text-slate-500">
                    ر.س / {plan.period}
                  </span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-[13px] text-slate-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" strokeWidth={2.5} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === "مؤسسات" ? "/frequently_asked_questions" : "/login"}
                className={`mt-7 inline-flex h-11 items-center justify-center rounded-xl px-5 text-[13px] font-semibold ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {plan.name === "مؤسسات" ? "تواصل مع المبيعات" : "ابدأ الآن"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      
    </main>
  );
}