import Link from "next/link";
import {
  Car,
  UserCog,
  PackageSearch,
  Route,
  Wrench,
  Building2,
  ShieldCheck,
  ClipboardList,
  FileBarChart2,
} from "lucide-react";


type Tone = "blue" | "emerald" | "amber";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
};

const featureGroups: { icon: typeof Car; tone: Tone; title: string; text: string }[] = [
  {
    icon: Car,
    tone: "blue",
    title: "إدارة المركبات",
    text: "سجل كامل لكل مركبة: بيانات الترخيص، التأمين، الفحص الدوري، وحالة المركبة الحالية.",
  },
  {
    icon: UserCog,
    tone: "emerald",
    title: "إدارة السائقين",
    text: "بيانات الهوية والرخصة وبطاقة السائق، مع تنبيهات قبل انتهاء أي مستند بـ90 يومًا.",
  },
  {
    icon: PackageSearch,
    tone: "amber",
    title: "إدارة الطلبات",
    text: "إنشاء الطلبات، متابعة حالتها من الإنشاء وحتى التسليم، وربطها بالرحلات والعملاء.",
  },
  {
    icon: Route,
    tone: "blue",
    title: "تنظيم الرحلات",
    text: "تعيين سائق ومركبة لكل رحلة، مع تحديث تلقائي لحالتيهما عند بدء الرحلة وانتهائها.",
  },
  {
    icon: Wrench,
    tone: "emerald",
    title: "سجل الصيانة",
    text: "تتبع تكلفة ومدة كل عملية صيانة، مع أرشيف كامل وربط تلقائي بحالة المركبة.",
  },
  {
    icon: Building2,
    tone: "amber",
    title: "إدارة الفروع",
    text: "أدر عدة فروع وعناوين بمواقعها الجغرافية، وربطها بالمستخدمين والمركبات.",
  },
  {
    icon: ShieldCheck,
    tone: "blue",
    title: "أدوار وصلاحيات",
    text: "تحكم دقيق فيما يمكن لكل مستخدم فعله، عبر صلاحيات قابلة للتخصيص لكل دور.",
  },
  {
    icon: ClipboardList,
    tone: "emerald",
    title: "سجل التدقيق",
    text: "سجل كامل لكل الإجراءات على النظام: من قام بها، ومتى، وعلى أي بيانات.",
  },
  {
    icon: FileBarChart2,
    tone: "amber",
    title: "تقارير مفصّلة",
    text: "تقارير يومية للسائقين وتقارير تفصيلية للرحلات، جاهزة للمشاركة والطباعة.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#ECEEF2] text-slate-900" dir="rtl">
    

      <section className="bg-[linear-gradient(145deg,#0D47A1_0%,#1A73E8_45%,#1565C0_100%)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
            المميزات
          </p>
          <h1 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-tight lg:text-[36px]">
            كل أدوات إدارة الأسطول في منصة واحدة
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/75">
            من أول تسجيل مركبة جديدة وحتى تسليم آخر شحنة، صممنا كل ميزة لتوفّر
            عليك الوقت وتمنحك رؤية واضحة على عملياتك.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureGroups.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[feature.tone]}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-500">{feature.text}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h2 className="text-[20px] font-extrabold text-slate-900">
            عايز تجرب المنصة بنفسك؟
          </h2>
          <p className="max-w-xl text-[14px] text-slate-500">
            سجّل الدخول للوحة التحكم أو تواصل معنا لمعرفة الخطة المناسبة لفريقك.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl bg-blue-600 px-6 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/prices"
              className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-6 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              عرض الأسعار
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}